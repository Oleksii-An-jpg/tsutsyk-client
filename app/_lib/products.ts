/**
 * What we sell.
 *
 * Prices live here, on the server, and are looked up by id — the browser sends
 * a product id and a quantity, never an amount. Otherwise anyone could open
 * devtools and buy a tracker for one kopiyka.
 */

export type Product = {
    id: string;
    /** Shown on the payment page and in the monobank statement. */
    name: string;
    description: string;
    /** Unit price in minor units (kopiykas). */
    price: number;
    /** Unit of measure for the invoice basket. */
    unit: string;
    /** Absolute or root-relative image used in the invoice basket. */
    image: string;
    /** Upper bound per order — these are assembled by hand, one at a time. */
    maxQuantity: number;
};

/**
 * TODO(pricing): 4 900 ₴ is a placeholder — confirm the real pre-order price
 * before this goes live. `TSUTSYK_PRICE_KOPIYKAS` overrides it per environment
 * so staging can run at 1 ₴ without touching the code.
 *
 * The landing page is statically prerendered, so the override has to be set at
 * *build* time as well as at runtime. Setting it for the running server alone
 * would show the old price and charge the new one.
 */
const TRACKER_PRICE = Number(process.env.TSUTSYK_PRICE_KOPIYKAS ?? 490_000);

export const PRODUCTS = {
    "tsutsyk-tracker": {
        id: "tsutsyk-tracker",
        name: "GPS-трекер «Цуцик»",
        description:
            "GPS/LTE-трекер на нашийник: живе відстеження, push-сповіщення, власна плата, зібрана вручну.",
        price: TRACKER_PRICE,
        unit: "шт.",
        image: "/karemat.jpg",
        maxQuantity: 3,
    },
} as const satisfies Record<string, Product>;

export type ProductId = keyof typeof PRODUCTS;

export function getProduct(id: string): Product | null {
    return Object.hasOwn(PRODUCTS, id)
        ? PRODUCTS[id as ProductId]
        : null;
}

/** 490000 → "4 900 ₴". Narrow no-break spaces keep the price on one line. */
export function formatPrice(kopiykas: number): string {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: kopiykas % 100 === 0 ? 0 : 2,
    }).format(kopiykas / 100);
}
