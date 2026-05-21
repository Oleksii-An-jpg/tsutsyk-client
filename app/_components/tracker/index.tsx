'use client';
import {APIProvider, Map} from '@vis.gl/react-google-maps';
import {FC, useEffect} from "react";
import {useTsutsykTracking} from "@/app/_lib/useTracker";
import Me from './me'
import Tsutsyk from "@/app/_components/tracker/tsutsyk";
import Track from "@/app/_components/tracker/track";
import {useReactiveVar} from "@apollo/client/react";
import {Spinner, AbsoluteCenter, Box, Text, Alert, VStack} from "@chakra-ui/react";
import Controls from "@/app/_components/tracker/controls";
import Settings from "@/app/_components/tracker/settings";
import {me} from "@/app/_lib/me";
import type { userAgent } from 'next/server'

type TrackerProps = {
    userAgent: ReturnType<typeof userAgent>
}

const Tracker: FC<TrackerProps> = ({ userAgent }) => {
    const self = useReactiveVar(me);
    const { position, completed, tsutsykIds, geolocationAllowed } = self;
    useEffect(() => {
        let watchId: number | null = null;

        const startWatching = () => {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    me({
                        ...me(),
                        position: { lat: position.coords.latitude, lng: position.coords.longitude },
                        completed: true,
                        geolocationAllowed: true,
                        geolocationAvailable: true,
                    });
                },
                (err) => {
                    me({
                        ...me(),
                        completed: true,
                        geolocationAllowed: err.code !== err.PERMISSION_DENIED,
                        geolocationAvailable: err.code !== err.POSITION_UNAVAILABLE,
                    });
                },
                { maximumAge: 10000, timeout: 10000 }
            );
        };

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                console.log('permission state:', result.state);

                if (result.state === 'denied') {
                    console.log('denied — not starting watch');
                    me({ ...me(), geolocationAllowed: false, completed: true });
                    return;
                }

                console.log('starting watch...');
                startWatching();

                result.onchange = () => {
                    const allowed = result.state !== 'denied';
                    me({ ...me(), geolocationAllowed: allowed, geolocationAvailable: allowed, completed: true });
                    if (allowed) window.location.reload();
                };
            });
        } else {
            console.log('no permissions API — starting watch directly');
            startWatching();
        }

        return () => {
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, []);
    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps api key is not provided')
    }

    const { session, trail, isLive, latestLocation } = useTsutsykTracking(tsutsykIds[0]);

    if (completed && !geolocationAllowed) {
        return  <AbsoluteCenter textAlign="center" px={8}>
            <Alert.Root status="warning" variant="subtle">
                <Alert.Content>
                    <Alert.Title>
                        Location access blocked
                    </Alert.Title>
                    <Alert.Description>
                        <VStack>
                            <Text fontSize="sm">
                                {userAgent.device.vendor === 'Apple'
                                    ? 'Go to Settings → Safari → Location → Allow'
                                    : userAgent.browser.name === 'Firefox'
                                        ? 'Click the lock icon in the address bar → Connection secure → More information → Permissions'
                                        : 'Click the lock icon in the address bar → Site settings → Location → Allow'}
                            </Text>
                        </VStack>
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        </AbsoluteCenter>
    }
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
                <Controls session={session} location={latestLocation} />
            </Box>
        </Map> : <AbsoluteCenter>
            <Spinner size="xl" />
        </AbsoluteCenter>}
    </APIProvider>
}

export default Tracker;