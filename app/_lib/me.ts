import {makeVar as makeLove} from "@apollo/client";
import {User} from "firebase/auth";

export type Me = {
    position?: google.maps.LatLngLiteral
    geolocationAllowed: boolean;
    geolocationAvailable: boolean;
    user: User | null;
    tsutsykIds: string[];
    authorised: boolean;
    authenticated: boolean;
    checked: boolean;
    tsutsyksChecked: boolean;
}

export const me = makeLove<Me>({
    user: null,
    tsutsykIds: [],
    geolocationAvailable: false,
    authorised: false,
    checked: false,
    authenticated: false,
    tsutsyksChecked: false,
    geolocationAllowed: false,
})

// The var is compared by reference, so writing an equal-but-new object still
// re-renders every consumer — the whole map included. Geolocation errors
// arrive in bursts of a dozen, so patching blindly would mean a burst of
// full-map re-renders that change nothing on screen.
export function patchMe(patch: Partial<Me>) {
    const current = me();
    const changed = (Object.keys(patch) as (keyof Me)[]).some((key) => current[key] !== patch[key]);
    if (changed) {
        me({...current, ...patch});
    }
}

// Firebase answering is not the same as knowing whether someone may use the
// tracker: a ґазда who isn't an admin only becomes authorised once
// getMyTsutsyks comes back. Anything that branches on `authorised` has to wait
// for this, or it acts on a "no" that is really a "not yet" — bouncing the
// owner through /auth, or flashing the no-device screen at them mid-sign-in.
export function authSettled({checked, authenticated, tsutsyksChecked}: Me) {
    return checked && (!authenticated || tsutsyksChecked);
}
