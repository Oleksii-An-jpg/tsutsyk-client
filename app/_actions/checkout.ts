'use server'

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, callApi } from "@/app/_lib/api";

/** Non-null only when checkout failed — success leaves via a redirect. */
export type CheckoutState = { error: string } | null;

export type CheckoutInput = {
    productId: string;
    quantity: number;
    /** The buyer's Firebase ID token. Without one the API refuses the order. */
    idToken: string;
    delivery: {
        recipientName: string;
        phone: string;
        city: string;
        branch: string;
        comment?: string | null;
    };
};

/** Where monobank sends the buyer once they are done, paid or not. */
const RETURN_PATH = "/orders";

const PLACE_ORDER = /* GraphQL */ `
    mutation PlaceOrder($input: PlaceOrderInput!) {
        placeOrder(input: $input) {
            pageUrl
            order {
                id
            }
        }
    }
`;

/**
 * Absolute origin of this deployment, for the URL monobank returns the buyer
 * to. Prefer the configured value; fall back to the incoming request so a
 * preview deployment works without extra configuration.
 */
async function resolveBaseUrl(): Promise<string> {
    const configured = process.env.NEXT_PUBLIC_SITE_URL;
    if (configured) return configured.replace(/\/+$/, "");

    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
    const proto = headersList.get("x-forwarded-proto") ?? "https";
    if (!host) throw new Error("cannot resolve the site URL for the return trip");
    return `${proto}://${host}`;
}

/**
 * Places the order through the API and sends the buyer to monobank's payment
 * page.
 *
 * The amount is never among the arguments — the API prices the order from its
 * own catalogue, so it cannot be edited on its way in. The checks below are
 * for a decent error message: a Server Action is a public endpoint, and the
 * API enforces the same rules whatever is posted to this one.
 */
export async function startCheckout(
    _previous: CheckoutState,
    input: CheckoutInput
): Promise<CheckoutState> {
    const productId = input?.productId?.trim();
    if (!productId) {
        return { error: "Такого товару немає." };
    }

    const quantity = Number(input.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: "Кількість має бути цілим числом, від 1." };
    }

    // Without a token the API refuses the order outright: every order has an
    // owner. An empty one here means the session lapsed while the form was open.
    if (!input.idToken) {
        return { error: "Схоже, сесія завершилася. Увійдіть ще раз і спробуйте знову." };
    }

    const text = (value?: string | null) => String(value ?? "").trim();
    const delivery = {
        method: "NOVA_POSHTA_BRANCH",
        recipientName: text(input.delivery?.recipientName),
        phone: text(input.delivery?.phone),
        city: text(input.delivery?.city),
        branch: text(input.delivery?.branch),
        comment: text(input.delivery?.comment) || null,
    };

    if (
        !delivery.recipientName ||
        !delivery.phone ||
        !delivery.city ||
        !delivery.branch
    ) {
        return { error: "Заповніть дані доставки — без них ми не знаємо, куди везти." };
    }

    let pageUrl: string;

    try {
        const baseUrl = await resolveBaseUrl();

        const { placeOrder } = await callApi<{
            placeOrder: { pageUrl: string; order: { id: string } };
        }>(
            PLACE_ORDER,
            {
                input: {
                    items: [{ productId, quantity }],
                    delivery,
                    // The API appends ?order=<number>, so the buyer lands on
                    // their own order rather than back on the shop window.
                    redirectUrl: `${baseUrl}${RETURN_PATH}`,
                },
            },
            { idToken: input.idToken }
        );

        pageUrl = placeOrder.pageUrl;
    } catch (error) {
        // The API's messages are written for developers, and can name the
        // reason an invoice was refused — log them, and hand the buyer
        // something they can act on.
        console.error("[checkout] could not place the order", error);

        return {
            error:
                error instanceof ApiError
                    ? "Не вдалося створити платіж. Спробуйте ще раз за хвилину."
                    : "Не вдалося створити платіж. Спробуйте ще раз.",
        };
    }

    // Outside the try on purpose: redirect works by throwing, and the catch
    // above would turn a successful checkout into an error message.
    redirect(pageUrl);
}
