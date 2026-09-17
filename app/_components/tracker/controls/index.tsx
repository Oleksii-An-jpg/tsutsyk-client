import {FC, useCallback, useEffect} from "react";
import {ButtonGroup, IconButton, Icon} from "@chakra-ui/react";
import {BiBody, BiSolidDog, BiStop} from "react-icons/bi";
import {useMap} from "@vis.gl/react-google-maps";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {useEndSession} from "@/app/_lib/useTracker";
import {SessionFragmentFragment} from "@/app/_documents/fragments/__generated__/SESSION_FRAGMENT.codegen";
import type {userAgent} from "next/server";
import PushNotificationManager from "@/app/_components/notification";
import {useOnboardingTour} from "@/app/_hooks/useOnboardingTour";

type ControlsProps = {
    location?: Location | null;
    session?: SessionFragmentFragment | null
    userAgent: ReturnType<typeof userAgent>
}

const Controls: FC<ControlsProps> = ({ location, session, userAgent }) => {
    const map = useMap();
    const {position} = useReactiveVar(me);
    const [mutate, { loading: stopping }] = useEndSession();

    const stopSession = useCallback(() => {
        if (session?.id) {
            return mutate({
                variables: {
                    sessionId: session?.id
                }
            })
        }
    }, [mutate, session?.id]);

    const { start } = useOnboardingTour();

    // Only ever an offer: the hook itself decides whether this person is owed a
    // tour, and takes it back down when the map goes away.
    useEffect(() => {
        start();
    }, [start]);

    return <ButtonGroup orientation="vertical" size="sm" variant="solid">
        <PushNotificationManager />
        {/*<InstallPrompt />*/}
        <IconButton title="Завершити сесію" data-tour="stop-session" colorPalette="red" onClick={stopSession} loading={stopping}>
            <Icon size="lg">
                <BiStop />
            </Icon>
        </IconButton>
        <IconButton title="До цуцика 🐾" data-tour="focus-tsutsyk" disabled={!location} onClick={() => {
            if (location) {
                map?.setCenter({
                    lat: location.latitude,
                    lng: location.longitude
                })
            }
        }} colorPalette="pink"><BiSolidDog /></IconButton>
        <IconButton disabled={!position} title="До мене 📍" data-tour="focus-me" onClick={() => {
            if (position) {
                map?.setCenter(position);
            }
        }}><BiBody /></IconButton>
    </ButtonGroup>
}

export default Controls;
