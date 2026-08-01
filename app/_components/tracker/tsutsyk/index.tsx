import {FC, useEffect, useMemo} from "react";
import {Avatar, Status, Float, Badge} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {ringCss} from "@/app/_components/tracker/ring";
import {BiSolidBatteryCharging} from "react-icons/bi";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";
import {sendNotification} from "@/app/actions";

type TsutsykProps = {
    location: Location;
    isLive: boolean;
    photoUrl?: string | null;
    alertDistanceMeters?: number | null;
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

function distanceFromLocation(location: Location, point: google.maps.LatLngLiteral): number {
    return google.maps.geometry.spherical.computeDistanceBetween(
        { lat: location.latitude, lng: location.longitude },
        point
    );
}

const Tsutsyk: FC<TsutsykProps> = ({ location, isLive, photoUrl, alertDistanceMeters }) => {
    const { position } = useReactiveVar(me);

    const shouldNotify = useMemo(() => {
        return isLive && location && position && alertDistanceMeters != null && distanceFromLocation(location, position) > alertDistanceMeters
    }, [alertDistanceMeters, isLive, location, position])

    useEffect(() => {
        if (shouldNotify) {
            sendNotification('Ой-ой! 🐶 Цуцик забіг задалеко 🐾').finally(console.log)
        }
    }, [shouldNotify]);

    return <AdvancedMarker position={{
        lat: location.latitude,
        lng: location.longitude
    }}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="pink">
            <Avatar.Fallback name="Карематик" />
            {photoUrl && <Avatar.Image src={photoUrl} />}
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