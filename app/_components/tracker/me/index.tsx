import {FC, useEffect, useState} from "react";
import {Avatar} from "@chakra-ui/react";
import {AdvancedMarker} from "@vis.gl/react-google-maps";
import {ringCss} from "@/app/_components/tracker/ring";

const Me: FC = () => {
    const [me, setMe] = useState<google.maps.LatLngLiteral>({
        lat: 46.4600902,
        lng: 30.5469775
    });
    useEffect(() => {
        navigator.geolocation.getCurrentPosition((position) => {
            setMe({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            })
        });
    }, []);
    return <AdvancedMarker position={me}>
        <Avatar.Root size="xs" css={ringCss} colorPalette="green">
            <Avatar.Fallback name="Аліна Божнюк" />
            <Avatar.Image src="/alina.jpg" />
        </Avatar.Root>
    </AdvancedMarker>
}

export default Me