'use server'

/**
 * The address directory, from the browser.
 *
 * The picker is a Client Component and the Nova Poshta key is not something
 * to ship to it, so the three lookups go through here. Everything they return
 * is the same public directory Nova Poshta puts on its own site, and none of
 * them writes anything — a Server Action is a public endpoint, and these are
 * ones that can be.
 *
 * The arguments are trimmed and clipped rather than trusted. Not for safety
 * — there is nothing here to abuse — but so that a stray keystroke cannot
 * turn into a request Nova Poshta rejects, and so the cache keys underneath
 * stay a handful per settlement instead of one per whitespace variation.
 */

import {regions, settlements, warehouses} from "@/app/_lib/novaposhta";
import {Region, Settlement, Warehouse} from "@/app/_lib/novaposhta/types";

/** Long enough for the longest place name in the country, and then some. */
const MAX_QUERY_LENGTH = 64;

function clean(value: string | undefined): string {
    return (value ?? "").trim().slice(0, MAX_QUERY_LENGTH);
}

export async function listRegions(): Promise<Region[]> {
    return regions();
}

export async function findSettlements(areaRef: string, query: string): Promise<Settlement[]> {
    return settlements({areaRef: clean(areaRef), query: clean(query)});
}

export async function findWarehouses(settlementRef: string, query: string): Promise<Warehouse[]> {
    const ref = clean(settlementRef);
    // No settlement, no branches — asking Nova Poshta for every branch in the
    // country would only time out.
    if (!ref) return [];

    return warehouses({settlementRef: ref, query: clean(query)});
}
