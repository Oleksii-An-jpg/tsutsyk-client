/**
 * What we sell, as the API tells it.
 *
 * Prices are not duplicated here: the same catalogue that prices the monobank
 * invoice is the one this page quotes, so the storefront can never advertise
 * a number we do not charge.
 */

import { callApi } from "@/app/_lib/api";

export type Product = {
    id: string;
    name: string;
    description: string;
    /** Unit price in minor units (kopiykas). */
    price: number;
    unit: string;
    image: string;
    maxQuantity: number;
};

const PRODUCTS_QUERY = /* GraphQL */ `
    query GetProducts {
        getProducts {
            id
            name
            description
            price
            unit
            image
            maxQuantity
        }
    }
`;

/** Prices change rarely; five minutes is plenty fresh and keeps the page static. */
const CATALOGUE_TTL_SECONDS = 300;

export async function getProducts(): Promise<Product[]> {
    const { getProducts } = await callApi<{ getProducts: Product[] }>(
        PRODUCTS_QUERY,
        {},
        { revalidate: CATALOGUE_TTL_SECONDS }
    );
    return getProducts;
}

/**
 * One product, or null when the API cannot be reached.
 *
 * Null rather than a throw on purpose: the landing page is the shop window,
 * and it is better to show it without a price than to show an error — the
 * price is quoted again on monobank's payment page anyway.
 */
export async function getProduct(id: string): Promise<Product | null> {
    try {
        const products = await getProducts();
        return products.find((product) => product.id === id) ?? null;
    } catch (error) {
        console.error("[catalogue] could not load the catalogue", error);
        return null;
    }
}

/** 490000 → "4 900 ₴". Narrow no-break spaces keep the price on one line. */
export function formatPrice(kopiykas: number): string {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: kopiykas % 100 === 0 ? 0 : 2,
    }).format(kopiykas / 100);
}
