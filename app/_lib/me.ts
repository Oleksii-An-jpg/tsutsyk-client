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
}

export const me = makeLove<Me>({
    user: null,
    tsutsykIds: [],
    geolocationAvailable: false,
    completed: false,
    authorised: false,
    checked: false,
    authenticated: false,
    geolocationAllowed: false,
})