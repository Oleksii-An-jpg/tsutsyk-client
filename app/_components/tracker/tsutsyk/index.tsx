import {FC} from "react";
import {Avatar, Status, Float, Badge} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {ringCss} from "@/app/_components/tracker/ring";
import {BiSolidBatteryCharging} from "react-icons/bi";

type TsutsykProps = {
    location: Location;
    isLive: boolean;
}

const Tsutsyk: FC<TsutsykProps> = ({ location, isLive }) => {
    return <AdvancedMarker position={{
        lat: location.latitude,
        lng: location.longitude
    }}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="pink">
            <Avatar.Fallback name="Карематик" />
            <Avatar.Image src="/karemat.JPG" />
            <Float placement="top-center" offsetY="-4">
                <Badge colorPalette="green">
                    <BiSolidBatteryCharging />
                    {location.battery}
                </Badge>
            </Float>
            <Float placement="bottom-end" offsetX="1" offsetY="1">
                <Status.Root colorPalette={isLive ? 'green' : 'red'}>
                    <Status.Indicator />
                </Status.Root>
            </Float>
        </Avatar.Root>
    </AdvancedMarker>
}

export default Tsutsyk