import {FC, useCallback} from "react";
import {ButtonGroup, IconButton} from "@chakra-ui/react";
import {BiBody, BiSolidDog, BiStopCircle} from "react-icons/bi";
import {useMap} from "@vis.gl/react-google-maps";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {useEndSession} from "@/app/_lib/useTracker";
import {SessionFragmentFragment} from "@/app/_documents/fragments/__generated__/SESSION_FRAGMENT.codegen";
import type {userAgent} from "next/server";
import PushNotificationManager from "@/app/_components/notification";

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
    }, [mutate, session?.id])
    return <ButtonGroup orientation="vertical" size="sm" variant="solid">
        <PushNotificationManager />
        {/*<InstallPrompt />*/}
        <IconButton rounded="full" colorPalette="red" onClick={stopSession} loading={stopping}>
            <BiStopCircle />
        </IconButton>
        <IconButton disabled={!location} onClick={() => {
            if (location) {
                map?.setCenter({
                    lat: location.latitude,
                    lng: location.longitude
                })
            }
        }} rounded="full" colorPalette="pink"><BiSolidDog /></IconButton>
        <IconButton onClick={() => {
            map?.setCenter(position);
        }} rounded="full"><BiBody /></IconButton>
    </ButtonGroup>
}

export default Controls;
