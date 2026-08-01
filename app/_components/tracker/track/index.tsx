import {FC, useMemo} from "react";
import {AdvancedMarker, Polyline} from "@vis.gl/react-google-maps";
import {Box} from "@chakra-ui/react";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {toLatLng} from "@/app/_lib/geo";

type TrackProps = {
    trail: Location[];
}

const TRACK_COLOR = "#2b7fff";
const MAX_FADE_SEGMENTS = 24; // caps polyline overlays for very long trails
const MAX_DOTS = 60; // caps marker overlays for very long trails

type Segment = {
    path: google.maps.LatLngLiteral[];
    opacity: number;
    isHead: boolean;
};

const Track: FC<TrackProps> = ({ trail }) => {
    const path = useMemo(() => trail.map(toLatLng), [trail]);

    // Split the trail into segments whose opacity ramps from faded (old) to
    // solid (recent), so the line conveys recency along the route.
    const segments = useMemo<Segment[]>(() => {
        if (path.length < 2) return [];
        const segmentCount = Math.min(MAX_FADE_SEGMENTS, path.length - 1);
        const pointsPerSegment = (path.length - 1) / segmentCount;
        return Array.from({ length: segmentCount }, (_, i) => {
            const start = Math.round(i * pointsPerSegment);
            const end = i === segmentCount - 1 ? path.length - 1 : Math.round((i + 1) * pointsPerSegment);
            return {
                path: path.slice(start, end + 1),
                opacity: 0.15 + (0.75 * (i + 1)) / segmentCount,
                isHead: i === segmentCount - 1,
            };
        });
    }, [path]);

    // Sample dots at fix intervals; real spacing between them reflects speed
    // (closer together = slower, spread out = faster) using existing fixes.
    const dots = useMemo(() => {
        if (trail.length < 3) return [];
        const stride = Math.max(1, Math.ceil((trail.length - 2) / MAX_DOTS));
        const points: Location[] = [];
        for (let i = 1; i < trail.length - 1; i += stride) points.push(trail[i]);
        return points;
    }, [trail]);

    if (segments.length === 0) return null;

    return <>
        {segments.map((segment, i) => (
            <Polyline
                key={i}
                path={segment.path}
                strokeColor={TRACK_COLOR}
                strokeOpacity={segment.opacity}
                strokeWeight={segment.isHead ? 4 : 3}
                icons={segment.isHead ? [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                        scale: 3,
                        fillColor: TRACK_COLOR,
                        fillOpacity: 1,
                        strokeColor: TRACK_COLOR,
                    },
                    offset: "100%",
                }] : undefined}
            />
        ))}
        {dots.map(location => (
            <AdvancedMarker key={location.id} position={toLatLng(location)}>
                <Box boxSize="6px" borderRadius="full" bg={TRACK_COLOR} opacity={0.6} />
            </AdvancedMarker>
        ))}
    </>
}

export default Track;
