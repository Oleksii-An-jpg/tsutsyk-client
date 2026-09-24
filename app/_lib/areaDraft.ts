import {makeVar} from "@apollo/client";
import {LatLngLiteral} from "@/app/_lib/geo";

/**
 * The alert area being drawn on the map, if any.
 *
 * Shared through a reactive var because the two halves of drawing live far
 * apart: the settings drawer is where an owner asks to draw, and the map is
 * where the taps land — and the drawer has to close for the map to be tapped.
 */
export type AreaDraft = {
    /** The area being redrawn, or null for a new one. */
    areaId: string | null;
    name: string;
    points: LatLngLiteral[];
};

export const areaDraft = makeVar<AreaDraft | null>(null);
