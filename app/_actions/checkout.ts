'use server'

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, callApi } from "@/app/_lib/api";

/** Non-null only when checkout failed — success leaves via a redirect. */
export type CheckoutState = { error: string } | null;

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
 * Takes `FormData` from the checkout form: a product id, a quantity, where the
 * tracker should go, and the caller's Firebase ID token. The amount is never
 * among them — the API prices the order from its own catalogue, so it cannot
 * be edited on its way in. The checks here are for a decent error message; the
 * API enforces the same rules whatever is posted to this endpoint.
 */
export async function startCheckout(
    _previous: CheckoutState,
    formData: FormData
): Promise<CheckoutState> {
    const text = (field: string) => String(formData.get(field) ?? "").trim();

    const productId = text("productId");
    if (!productId) {
        return { error: "Такого товару немає." };
    }

    const quantity = Number(formData.get("quantity") ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: "Кількість має бути цілим числом, від 1." };
    }

    // Without a token the API refuses the order outright: every order has an
    // owner. An empty one here means the session lapsed while the form was open.
    const idToken = text("idToken");
    if (!idToken) {
        return { error: "Схоже, сесія завершилася. Увійдіть ще раз і спробуйте знову." };
    }

    const delivery = {
        method: "NOVA_POSHTA_BRANCH",
        recipientName: text("recipientName"),
        phone: text("phone"),
        city: text("city"),
        branch: text("branch"),
        comment: text("comment") || null,
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
            { idToken }
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
