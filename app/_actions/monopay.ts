'use server'

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";

import { signOrder, UAH, type SignedOrder } from "@/app/_lib/monopay";
import { getProduct } from "@/app/_lib/products";

/** How long the invoice stays payable. */
const VALIDITY_SECONDS = 3 * 60 * 60;

export type PrepareResult =
    | { ok: true; order: SignedOrder }
    | { ok: false; error: string };

/**
 * Absolute origin of this deployment, for the URLs monobank calls back on.
 * Prefer the configured value; fall back to the incoming request so a preview
 * deployment works without extra configuration.
 */
async function resolveBaseUrl(): Promise<string> {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured) return configured.replace(/\/+$/, "");

    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") ?? "https";
    if (!host) throw new Error("cannot resolve the site URL for monobank callbacks");
    return `${proto}://${host}`;
}

/**
 * Signs an order for the monopay widget.
 *
 * A Server Action is a public endpoint, so this trusts nothing from the caller
 * but a product id and a quantity — the price comes from the server-side
 * catalogue. Otherwise the amount could simply be edited on its way in.
 */
export async function prepareMonopayOrder(input: {
    productId: string;
    quantity: number;
}): Promise<PrepareResult> {
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

        return {
            ok: true,
            order: signOrder({
                amount,
                ccy: UAH,
                merchantPaymInfo: {
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
                },
                // The webhook URL travels inside the signed payload — this is
                // what tells monobank where to report the payment, and signing
                // it means nobody can point our callbacks elsewhere.
                webHookUrl: `${baseUrl}/api/monobank/webhook`,
                redirectUrl: baseUrl,
                validity: VALIDITY_SECONDS,
            }),
        };
    } catch (error) {
        // A missing or malformed key is a deployment problem, not something the
        // buyer can act on — log it here and keep the message generic.
        console.error("[monopay] could not sign order", error);
        return { ok: false, error: "Оплата тимчасово недоступна." };
    }
}
