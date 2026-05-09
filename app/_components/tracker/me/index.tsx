import {FC} from "react";
import {Avatar, Float, Status} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {ringCss} from "@/app/_components/tracker/ring";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";

const Me: FC = () => {
    const {position, geolocationAllowed, geolocationAvailable} = useReactiveVar(me);
    return <AdvancedMarker position={position}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="green">
            <Avatar.Fallback name="Аліна Божнюк" />
            <Avatar.Image src="/alina.jpg" />
            <Float placement="bottom-end" offsetX="1" offsetY="1">
                <Status.Root colorPalette={geolocationAvailable && geolocationAllowed ? 'green' : 'red'}>
                    <Status.Indicator />
                </Status.Root>
            </Float>
        </Avatar.Root>
    </AdvancedMarker>
}

export default Me