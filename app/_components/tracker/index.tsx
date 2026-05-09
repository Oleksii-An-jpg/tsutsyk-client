'use client';
import {APIProvider, Map} from '@vis.gl/react-google-maps';
import {FC, useEffect} from "react";
import {useTsutsykTracking} from "@/app/_lib/useTracker";
import Me from './me'
import Tsutsyk from "@/app/_components/tracker/tsutsyk";
import Track from "@/app/_components/tracker/track";
import {useReactiveVar} from "@apollo/client/react";
import {Spinner, AbsoluteCenter, Box} from "@chakra-ui/react";
import Controls from "@/app/_components/tracker/controls";
import Settings from "@/app/_components/tracker/settings";
import {me} from "@/app/_lib/me";

const Tracker: FC = () => {
    const self = useReactiveVar(me);
    const { position, completed, tsutsykIds } = self;
    useEffect(() => {
        navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
            if (result.state === 'denied') me({
                ...self,
                geolocationAllowed: false
            });

            // React to permission changes (e.g. user unblocks in settings)
            result.onchange = () => {
                me({
                    ...self,
                    geolocationAllowed: result.state === 'denied'
                });
            };
        });
        const id = navigator.geolocation.watchPosition((position) => {
            me({
                ...self,
                position: {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                },
                completed: true,
                geolocationAllowed: true
            });
        }, (positionError) => {
            console.error(positionError);

            me({
                ...self,
                position,
                completed: true,
                geolocationAllowed: Boolean(positionError.PERMISSION_DENIED)
            })
        }, {
            maximumAge: 0,
            timeout: 10000
        });

        return () => navigator.geolocation.clearWatch(id)
    }, [position, self]);
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps api key is not provided')
    }

    const { session, trail, isLive, latestLocation } = useTsutsykTracking(tsutsykIds[0]);

    return <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        {completed ? <Map
            mapId={'bf51a910020fa25a'}
            style={{width: '100vw', height: '100vh'}}
            defaultCenter={position}
            defaultZoom={12}
            gestureHandling='greedy'
            disableDefaultUI
        >
            <Me />
            <Track trail={trail} />
            {latestLocation && (
                <Tsutsyk location={latestLocation} isLive={isLive} />
            )}
            <Box className="fixed top-4 right-4">
                <Settings onSelectSession={(sessionId) => {
                    console.log(sessionId);
                }} activeSessionId={session?.id} tsutsykId={tsutsykIds[0]} />
            </Box>
            <Box className="fixed bottom-4 right-4">
                <Controls location={latestLocation} />
            </Box>
        </Map> : <AbsoluteCenter>
            <Spinner size="xl" />
        </AbsoluteCenter>}
    </APIProvider>
}

export default Tracker;