import {FC, useMemo} from "react";
import {Polyline} from "@vis.gl/react-google-maps";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";

type TrackProps = {
    trail: Location[];
}

const Track: FC<TrackProps> = ({ trail }) => {
    const path = useMemo(() => {
        return trail.map(location => ({
            lat: location.latitude,
            lng: location.longitude
        }))
    }, [trail])
    return <Polyline strokeColor="#2b7fff" path={path} />
}

export default Track;
