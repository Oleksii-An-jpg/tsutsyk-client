import {makeVar as makeLove} from "@apollo/client";
import {User} from "firebase/auth";

type Me = {
    position?: google.maps.LatLngLiteral
    geolocationAllowed: boolean;
    geolocationAvailable: boolean;
    user: User | null;
    tsutsykIds: string[];
    completed: boolean;
    authorised: boolean;
    authenticated: boolean;
    checked: boolean;
    tsutsyksChecked: boolean;
}

export const me = makeLove<Me>({
    user: null,
    tsutsykIds: [],
    geolocationAvailable: false,
    completed: false,
    authorised: false,
    checked: false,
    authenticated: false,
    tsutsyksChecked: false,
    geolocationAllowed: false,
})

// Firebase answering is not the same as knowing whether someone may use the
// tracker: a ґазда who isn't an admin only becomes authorised once
// getMyTsutsyks comes back. Anything that branches on `authorised` has to wait
// for this, or it acts on a "no" that is really a "not yet" — bouncing the
// owner through /auth, or flashing the no-device screen at them mid-sign-in.
export function authSettled({checked, authenticated, tsutsyksChecked}: Me) {
    return checked && (!authenticated || tsutsyksChecked);
}
