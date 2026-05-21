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

function formatLastSeen(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

const Tsutsyk: FC<TsutsykProps> = ({ location, isLive }) => {
    return <AdvancedMarker position={{
        lat: location.latitude,
        lng: location.longitude
    }}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="pink">
            <Avatar.Fallback name="Карематик" />
            <Avatar.Image src="/karemat.JPG" />
            <Float placement="bottom-center" offsetY="-4">
                <Badge colorPalette="blue">
                    {formatLastSeen(location.timestamp)}
                </Badge>
            </Float>
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