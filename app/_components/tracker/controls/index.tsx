import {FC} from "react";
import {ButtonGroup, IconButton} from "@chakra-ui/react";
import {BiBody, BiSolidDog} from "react-icons/bi";
import {useMap} from "@vis.gl/react-google-maps";
import {useReactiveVar} from "@apollo/client/react";
import {me} from '@/app/_lib/useTracker'
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";

type ControlsProps = {
    location?: Location | null;
}

const Controls: FC<ControlsProps> = ({ location }) => {
    const map = useMap();
    const {position} = useReactiveVar(me);
    return <ButtonGroup orientation="vertical" size="sm" variant="solid">
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