/**
 * What we sell, as the API tells it.
 *
 * Prices are not duplicated here: the same catalogue that prices the monobank
 * invoice is the one this page quotes, so the storefront can never advertise
 * a number we do not charge. The shape is not duplicated either — `Product`
 * is read off the generated types, so a field the API renames stops this
 * compiling rather than arriving undefined.
 */

import { QUERY_PRODUCTS } from "@/app/_documents/QUERY_PRODUCTS";
import { ProductsQuery } from "@/app/_documents/__generated__/QUERY_PRODUCTS.codegen";
import { serverQuery } from "@/app/_lib/apollo-server";

export type Product = ProductsQuery["getProducts"][number];

/** Prices change rarely; five minutes is plenty fresh and keeps the page static. */
const CATALOGUE_TTL_SECONDS = 300;

export async function getProducts(): Promise<Product[]> {
    const { getProducts } = await serverQuery<ProductsQuery>(
        QUERY_PRODUCTS,
        undefined,
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
