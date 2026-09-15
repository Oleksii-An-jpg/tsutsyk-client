import {FC} from "react";
import {Avatar, Float, Status} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {ringCss} from "@/app/_components/tracker/ring";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";

const Me: FC = () => {
    const {position, geolocationAllowed, geolocationAvailable, user} = useReactiveVar(me);

    // The map now opens without waiting for a fix, so there is a real window
    // where we have no position at all. A marker without one lands on Null
    // Island, which reads as "your ґазда is in the Atlantic".
    if (!position) {
        return null;
    }

    return <AdvancedMarker position={position}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="green">
            <Avatar.Fallback name={user?.displayName ?? undefined} />
            <Avatar.Image src={user?.photoURL ?? undefined} />
            <Float placement="bottom-end" offsetX="1" offsetY="1">
                <Status.Root colorPalette={geolocationAvailable && geolocationAllowed ? 'green' : 'red'}>
                    <Status.Indicator />
                </Status.Root>
            </Float>
        </Avatar.Root>
    </AdvancedMarker>
}

export default Me
