'use server'

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { createInvoice, MonobankError, UAH } from "@/app/_lib/monobank";
import { createOrder } from "@/app/_lib/orders";
import { getProduct } from "@/app/_lib/products";

/** How long the monopay page stays payable. */
const INVOICE_VALIDITY_SECONDS = 3 * 60 * 60;

export type CheckoutResult =
    | { ok: true; pageUrl: string }
    | { ok: false; error: string };

/**
 * Absolute origin of this deployment, used to build the URLs monobank calls
 * back on. Prefer the configured value; fall back to the incoming request so a
 * preview deployment works without extra configuration.
 */
async function resolveBaseUrl(): Promise<string> {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured) return configured.replace(/\/+$/, "");

    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") ?? "https";
    if (!host) throw new Error("Cannot resolve the site URL for monobank callbacks");
    return `${proto}://${host}`;
}

/**
 * Starts a monopay checkout and returns the hosted payment page to send the
 * buyer to.
 *
 * This is a public endpoint — a Server Action is reachable by anyone who can
 * load the page — so it trusts nothing from the caller but a product id and a
 * quantity. The price is read from the server-side catalogue.
 */
export async function startCheckout(input: {
    productId: string;
    quantity: number;
}): Promise<CheckoutResult> {
    const product = getProduct(input.productId);
    if (!product) {
        return { ok: false, error: "Такого товару немає." };
    }

    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.maxQuantity) {
        return {
            ok: false,
            error: `Можна замовити від 1 до ${product.maxQuantity} шт. за раз.`,
        };
    }

    const amount = product.price * quantity;
    const reference = randomUUID();

    try {
        const baseUrl = await resolveBaseUrl();

        const invoice = await createInvoice({
            amount,
            ccy: UAH,
            reference,
            destination: `Передзамовлення: ${product.name}`,
            comment: product.description,
            basketOrder: [
                {
                    name: product.name,
                    qty: quantity,
                    sum: amount,
                    unit: product.unit,
                    code: product.id,
                    icon: `${baseUrl}${product.image}`,
                },
            ],
            // The buyer comes back here; the page reconciles against monobank
            // because this redirect usually beats the webhook.
            redirectUrl: `${baseUrl}/order/${reference}`,
            webHookUrl: `${baseUrl}/api/monobank/webhook`,
            validity: INVOICE_VALIDITY_SECONDS,
        });

        // Recorded before the buyer leaves, so the webhook always has something
        // to update.
        await createOrder({
            reference,
            invoiceId: invoice.invoiceId,
            productId: product.id,
            quantity,
            amount,
            ccy: UAH,
            status: "created",
        });

        return { ok: true, pageUrl: invoice.pageUrl };
    } catch (error) {
        // The raw error can carry the merchant token or Firebase internals —
        // log it server-side, hand the buyer something they can act on.
        console.error("[monopay] checkout failed", error);

        return {
            ok: false,
            error:
                error instanceof MonobankError
                    ? "monobank не прийняв платіж. Спробуйте ще раз за хвилину."
                    : "Не вдалося створити платіж. Спробуйте ще раз.",
        };
    }
}
