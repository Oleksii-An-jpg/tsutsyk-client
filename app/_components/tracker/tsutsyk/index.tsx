import {FC, useEffect, useMemo, useReducer} from "react";
import {Avatar, Status, Float, Badge, Box, HStack, Text} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {ringCss, MARKER_STATUS_COLOR_PALETTE, MarkerStatus} from "@/app/_components/tracker/ring";
import {BiSolidBatteryCharging} from "react-icons/bi";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";
import {sendNotification} from "@/app/actions";
import {computeMovement} from "@/app/_lib/geo";

type TsutsykProps = {
    location: Location;
    previousLocation?: Location | null;
    isLive: boolean;
    name?: string | null;
    photoUrl?: string | null;
    alertDistanceMeters?: number | null;
}

const AVATAR_SIZE = "sm";
const AVATAR_BOX_SIZE = "9"; // must match the "sm" avatar recipe size token
const FRESH_WINDOW_MS = 30_000;
const MOVING_SPEED_THRESHOLD_MPS = 0.5; // filters GPS jitter while stationary
const LOW_BATTERY_PERCENT = 20;
const STALE_AFTER_MINS = 30;
const VERY_STALE_AFTER_MINS = 120;

function isRecentTimestamp(timestamp: string, windowMs: number): boolean {
    return Date.now() - new Date(timestamp).getTime() < windowMs;
}

function getLastSeenInfo(timestamp: string): { label: string; diffMins: number } {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return {label: "just now", diffMins};
    if (diffMins < 60) return {label: `${diffMins}m ago`, diffMins};
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return {label: `${diffHours}h ago`, diffMins};
    return {label: `${Math.floor(diffHours / 24)}d ago`, diffMins};
}

function lastSeenColorPalette(diffMins: number): string {
    if (diffMins >= VERY_STALE_AFTER_MINS) return "red";
    if (diffMins >= STALE_AFTER_MINS) return "orange";
    return "gray";
}

function batteryColorPalette(battery: number | null | undefined): string {
    if (battery == null) return "gray";
    if (battery < LOW_BATTERY_PERCENT) return "red";
    if (battery < 50) return "orange";
    return "green";
}

function distanceFromLocation(location: Location, point: google.maps.LatLngLiteral): number {
    return google.maps.geometry.spherical.computeDistanceBetween(
        { lat: location.latitude, lng: location.longitude },
        point
    );
}

const Tsutsyk: FC<TsutsykProps> = ({ location, previousLocation, isLive, name, photoUrl, alertDistanceMeters }) => {
    const { position } = useReactiveVar(me);

    // Re-render periodically so "Xm ago" / freshness keep advancing without a new location.
    const [, forceTick] = useReducer((c: number) => c + 1, 0);
    useEffect(() => {
        const id = setInterval(forceTick, 15_000);
        return () => clearInterval(id);
    }, []);

    const shouldNotify = useMemo(() => {
        return isLive && location && position && alertDistanceMeters != null && distanceFromLocation(location, position) > alertDistanceMeters
    }, [alertDistanceMeters, isLive, location, position])

    useEffect(() => {
        if (shouldNotify) {
            sendNotification('Ой-ой! 🐶 Цуцик забіг задалеко 🐾').finally(console.log)
        }
    }, [shouldNotify]);

    const movement = useMemo(() => {
        return previousLocation ? computeMovement(previousLocation, location) : null;
    }, [previousLocation, location]);

    const isMoving = (movement?.speedMetersPerSecond ?? 0) > MOVING_SPEED_THRESHOLD_MPS;

    const isLowBattery = isLive && location.battery != null && location.battery < LOW_BATTERY_PERCENT;
    const status: MarkerStatus = shouldNotify || isLowBattery
        ? "alert"
        : isLive && isMoving ? "active" : "idle";
    const statusColorPalette = MARKER_STATUS_COLOR_PALETTE[status];

    const isFresh = isLive && isRecentTimestamp(location.timestamp, FRESH_WINDOW_MS);

    const { label: lastSeenLabel, diffMins } = getLastSeenInfo(location.timestamp);
    // Alert-style coloring only matters while a session is live — a closed
    // session is just history, so battery/staleness don't need to alarm.
    const batteryPalette = isLive ? batteryColorPalette(location.battery) : "gray";
    const lastSeenPalette = isLive ? lastSeenColorPalette(diffMins) : "gray";
    const urgentPalette = status === "alert" ? "red" : lastSeenPalette !== "gray" ? lastSeenPalette : null;

    return <AdvancedMarker position={{
        lat: location.latitude,
        lng: location.longitude
    }}>
        <Box position="relative" boxSize={AVATAR_BOX_SIZE}>
            <Avatar.Root
                size={AVATAR_SIZE}
                css={ringCss}
                colorPalette={statusColorPalette}
                className={isFresh ? "tracker-marker-pulse" : undefined}
            >
                <Avatar.Fallback name={name || 'Цуцик'} />
                {photoUrl && <Avatar.Image src={photoUrl} />}
                <Float placement="bottom-center" offsetY="-3">
                    <Badge
                        size="xs"
                        variant="surface"
                        colorPalette="gray"
                        gap="1"
                        px="1.5"
                        opacity={urgentPalette ? 1 : 0.8}
                        borderWidth={urgentPalette ? "1px" : undefined}
                        borderColor={urgentPalette ? `${urgentPalette}.500` : undefined}
                    >
                        <HStack gap="1">
                            {location.battery != null && (
                                <HStack gap="0.5" color={`${batteryPalette}.600`}>
                                    <BiSolidBatteryCharging />
                                    <Text as="span" fontWeight="semibold">{location.battery}%</Text>
                                </HStack>
                            )}
                            <Text as="span" color={`${lastSeenPalette}.600`}>
                                {lastSeenLabel}
                            </Text>
                        </HStack>
                    </Badge>
                </Float>
                <Float placement="bottom-end" offsetX="1" offsetY="1">
                    <Status.Root colorPalette={isLive ? 'green' : 'red'}>
                        <Status.Indicator />
                    </Status.Root>
                </Float>
            </Avatar.Root>
        </Box>
    </AdvancedMarker>
}

export default Tsutsyk
