import {makeVar as makeLove} from "@apollo/client";
import {User} from "firebase/auth";

export type Me = {
    position?: google.maps.LatLngLiteral
    geolocationAllowed: boolean;
    geolocationAvailable: boolean;
    user: User | null;
    tsutsykIds: string[];
    authorised: boolean;
    /**
     * Whether the caller carries the `admin` custom claim — the one the API's
     * own `AdminGuard` checks, minted by `npm run grant:admin` over there.
     *
     * Kept apart from `authorised`, which answers a different question: that
     * one is "may this person use the tracker", and a ґазда who owns a Tsutsyk
     * is authorised without being one of us. Only this opens /admin.
     *
     * It is not the authorisation either way — the API re-checks the claim on
     * the token of every call. This is what stops us showing somebody a back
     * office whose every button would answer "Not allowed".
     */
    admin: boolean;
    authenticated: boolean;
    checked: boolean;
    tsutsyksChecked: boolean;
}

export const me = makeLove<Me>({
    user: null,
    tsutsykIds: [],
    admin: false,
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

/**
 * The phone number a Firebase account carries, wherever it happens to sit.
 *
 * `User.phoneNumber` is only filled in when a phone credential is the account's
 * own — somebody who signed in by SMS, or linked a number afterwards. An
 * account built on Google or e-mail keeps a linked number on the matching
 * entry in `providerData` instead, so reading the top-level field alone means
 * asking a buyer to type a number we already hold.
 *
 * Null means the account genuinely has no number — the e-mail and Google
 * sign-ins carry none — and the form asks for one, as it has to anyway.
 */
export function userPhone(user: User | null): string | null {
    if (!user) return null;
    if (user.phoneNumber) return user.phoneNumber;
    return user.providerData.find((profile) => profile.phoneNumber)?.phoneNumber ?? null;
}
