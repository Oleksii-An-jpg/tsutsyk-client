/**
 * Nova Poshta's address directory: oblasts, settlements, branches.
 *
 * Read-only, and only the three calls the branch picker makes. Nothing here
 * books a parcel — the API does that when an order ships; this is the
 * directory the buyer picks from so that the address on the order is one
 * Nova Poshta recognises rather than something typed from memory.
 *
 * Server-side only: `NOVAPOSHTA_API_KEY` rides along in every body, so
 * nothing here may be imported from a Client Component. The browser reaches
 * these through the Server Actions in `app/_actions/novaposhta.ts`.
 *
 * Every call is cached by Next's data cache. The requests are POSTs, which
 * are only cached when a `revalidate` is spelled out — it is, below — and the
 * cache key covers the body, so each oblast and each search term gets its own
 * entry. A directory that changes a few times a year does not need to be
 * asked twice per keystroke, and Nova Poshta rate-limits by key.
 */

import {
    RawRegion,
    RawSettlement,
    RawWarehouse,
    Region,
    Settlement,
    Warehouse,
} from "@/app/_lib/novaposhta/types";

const BASE_URL = "https://api.novaposhta.ua/v2.0/json/";

/**
 * `AddressGeneral` rather than `Address`: the two share these methods, but
 * the general model is the one documented for reading the directory and does
 * not touch the address book of the account the key belongs to.
 */
const MODEL = "AddressGeneral";

/** Oblasts are a fixed list of 25 — a day is if anything too eager. */
const REGIONS_TTL_SECONDS = 60 * 60 * 24;

/**
 * Settlements and branches move rarely, but they do move, and Nova Poshta
 * asks that the branch directory be refreshed daily. An hour is a compromise
 * that still collapses a page of typing into a handful of requests.
 */
const ADDRESSES_TTL_SECONDS = 60 * 60;

/** Nova Poshta caps a page at 150 settlements and 500 branches. */
const PAGE_SIZE = 50;

type Envelope<T> = {
    success: boolean;
    data: T[];
    errors?: string[];
};

/**
 * One call to the directory.
 *
 * Nova Poshta answers 200 whether or not it did what was asked — a refusal is
 * `success: false` with the reason in `errors` — so the status alone says
 * nothing and both have to be checked.
 */
async function call<T>(
    calledMethod: string,
    methodProperties: Record<string, string>,
    revalidate: number
): Promise<T[]> {
    const apiKey = process.env.NOVAPOSHTA_API_KEY;
    if (!apiKey) {
        throw new Error(
            "NOVAPOSHTA_API_KEY is not set — the address directory needs one"
        );
    }

    const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({apiKey, modelName: MODEL, calledMethod, methodProperties}),
        next: {revalidate},
    });

    if (!response.ok) {
        throw new Error(`Nova Poshta answered ${response.status} to ${calledMethod}`);
    }

    const payload: unknown = await response.json();

    // For the larger cities `getWarehouses` answers with a 303 to a cached
    // file, which `fetch` follows and which holds the bare array rather than
    // the envelope. The documentation asks that both be handled.
    if (Array.isArray(payload)) return payload as T[];

    const {success, data, errors} = payload as Envelope<T>;
    if (!success) {
        throw new Error(
            errors?.join("; ") || `Nova Poshta refused ${calledMethod} without saying why`
        );
    }

    return data ?? [];
}

/**
 * The name and its kind, put back together the way a Ukrainian says them:
 * "місто Київ", "Автономна Республіка Крим". The oblasts drop the word
 * itself — the field is already called "Область", and repeating it down
 * two dozen rows only makes the names harder to pick out.
 */
function regionLabel(raw: RawRegion): string {
    const name = raw.Description?.trim() ?? "";
    const type = raw.RegionType?.trim() ?? "";
    if (type.toLowerCase() === "область") return name.replace(/\s*область$/i, "").trim();
    if (!type || name.toLowerCase().includes(type.toLowerCase())) return name;

    return `${type} ${name}`;
}

/**
 * The line the buyer picks and the order stores.
 *
 * The raion is worth spelling out — village names repeat inside an oblast —
 * but the cities that are their own raion answer with the oblast's name in
 * that field, and "Київ, Київська, Київська область" helps nobody.
 */
function settlementLabel(raw: RawSettlement): string {
    const area = raw.AreaDescription?.trim() ?? "";
    const raion = raw.RegionsDescription?.trim() ?? "";

    const parts = [raw.Description?.trim()];
    if (raion && !area.startsWith(raion)) {
        parts.push(/р-н/.test(raion) ? raion : `${raion} р-н`);
    }
    if (area) parts.push(area);

    return parts.filter(Boolean).join(", ");
}

/** Every oblast, in the order a Ukrainian reader expects to find them. */
export async function regions(): Promise<Region[]> {
    const raw = await call<RawRegion>("getSettlementAreas", {Ref: ""}, REGIONS_TTL_SECONDS);

    return raw
        .map((region) => ({ref: region.Ref, label: regionLabel(region)}))
        .sort((a, b) => a.label.localeCompare(b.label, "uk"));
}

export type SettlementQuery = {
    /** An oblast's `ref`, to narrow the search. Empty searches the country. */
    areaRef?: string;
    /** What the buyer has typed. Nova Poshta only matches Ukrainian. */
    query?: string;
};

/**
 * Settlements matching what the buyer typed, optionally within one oblast.
 *
 * `Warehouse: "1"` drops the places Nova Poshta does not serve: offering one
 * would only produce a branch list with nothing in it.
 */
export async function settlements({areaRef, query}: SettlementQuery): Promise<Settlement[]> {
    const raw = await call<RawSettlement>(
        "getSettlements",
        {
            ...(areaRef ? {AreaRef: areaRef} : {}),
            ...(query ? {FindByString: query} : {}),
            Warehouse: "1",
            Page: "1",
            Limit: String(PAGE_SIZE),
        },
        ADDRESSES_TTL_SECONDS
    );

    return raw.map((settlement) => ({
        ref: settlement.Ref,
        label: settlementLabel(settlement),
        type: settlement.SettlementTypeDescription ?? "",
    }));
}

export type WarehouseQuery = {
    /** A settlement's `ref`, as `settlements()` hands it back. */
    settlementRef: string;
    /** A branch number or a street, as far as the buyer has typed it. */
    query?: string;
};

/**
 * Branches and parcel lockers in one settlement.
 *
 * Closed ones are dropped, but only when Nova Poshta says so in as many
 * words: an unfamiliar status is more likely a new kind of status than a
 * branch that is not there, and an empty list is the worse failure.
 */
export async function warehouses({settlementRef, query}: WarehouseQuery): Promise<Warehouse[]> {
    const raw = await call<RawWarehouse>(
        "getWarehouses",
        {
            SettlementRef: settlementRef,
            ...(query ? {FindByString: query} : {}),
            Page: "1",
            Limit: String(PAGE_SIZE),
            Language: "UA",
        },
        ADDRESSES_TTL_SECONDS
    );

    return raw
        .filter((warehouse) => !warehouse.WarehouseStatus || warehouse.WarehouseStatus === "Working")
        .map((warehouse) => ({
            ref: warehouse.Ref,
            description: warehouse.Description,
            shortAddress: warehouse.ShortAddress ?? "",
        }));
}
