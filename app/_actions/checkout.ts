'use server'

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { ApiError, callApi } from "@/app/_lib/api";

/** Non-null only when checkout failed — success leaves via a redirect. */
export type CheckoutState = { error: string } | null;

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
 * Takes `FormData` so the button can be a real form: submitted that way the
 * whole checkout works with JavaScript disabled, which a click handler calling
 * `window.location` cannot do.
 *
 * A Server Action is a public endpoint, so this trusts nothing from the caller
 * but a product id and a quantity — the API prices the order from its own
 * catalogue. The ID token, when the buyer is signed in, only ever widens what
 * the API does with the order: it attaches it to their account, so it shows up
 * under their orders without being claimed by hand.
 */
export async function startCheckout(
    _previous: CheckoutState,
    formData: FormData
): Promise<CheckoutState> {
    const productId = String(formData.get("productId") ?? "");
    if (!productId) {
        return { error: "Такого товару немає." };
    }

    const quantity = Number(formData.get("quantity") ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1) {
        return { error: "Кількість має бути цілим числом, від 1." };
    }

    const idToken = String(formData.get("idToken") ?? "") || null;

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
                    redirectUrl: baseUrl,
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
