import {FC} from "react";
import {Avatar, Circle, Float} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";
import {ringCss} from "@/app/_components/tracker/ring";

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
            <Float placement="bottom-end" offsetX="1" offsetY="1">
                <Circle
                    bg={ isLive ? 'green.500' : 'red.500' }
                    size="8px"
                    outline="0.2em solid"
                    outlineColor="bg"
                />
            </Float>
        </Avatar.Root>
    </AdvancedMarker>
}

export default Tsutsyk