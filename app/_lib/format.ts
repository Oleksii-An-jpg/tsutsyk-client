/**
 * Formatting shared by the server and the browser.
 *
 * Kept apart from `catalogue.ts` on purpose: that module reaches for the API,
 * and a Client Component importing a formatter should not drag server code
 * into the browser bundle with it.
 */

/** 490000 → "4 900 ₴". Narrow no-break spaces keep the price on one line. */
export function formatPrice(kopiykas: number): string {
    return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
        maximumFractionDigits: kopiykas % 100 === 0 ? 0 : 2,
    }).format(kopiykas / 100);
}

/** "16 вер. 2026 р., 14:05". Empty string for a missing date. */
export function formatDateTime(iso?: string | null): string {
    if (!iso) return "";
    return new Intl.DateTimeFormat("uk-UA", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(iso));
}

/**
 * The part of a Ukrainian number that goes after the `+380` the phone inputs
 * show as a prefix — the same shape the auth form keeps in its field.
 *
 * `+380671234567`, `380671234567` and `0671234567` all come back as
 * `671234567`, so a number we stored, one Firebase gave us and one somebody
 * typed all prefill the same way.
 */
export function toLocalPhone(phone?: string | null): string {
    const digits = String(phone ?? "").replace(/\D/g, "");
    return digits.length >= 9 ? digits.slice(-9) : digits;
}
