'use client';
import {APIProvider, Map} from '@vis.gl/react-google-maps';
import {FC, useEffect} from "react";
import {useTsutsyk, useTsutsykTracking} from "@/app/_lib/useTracker";
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
        let consecutiveErrors = 0;
        const ERROR_THRESHOLD = 3; // tune to taste

        const startWatching = () => {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    consecutiveErrors = 0;
                    me({
                        ...me(),
                        position: { lat: position.coords.latitude, lng: position.coords.longitude },
                        completed: true,
                        geolocationAllowed: true,
                        geolocationAvailable: true,
                    });
                },
                (err) => {
                    if (err.code === err.PERMISSION_DENIED) {
                        me({ ...me(), completed: true, geolocationAllowed: false });
                        return;
                    }

                    consecutiveErrors += 1;

                    if (consecutiveErrors < ERROR_THRESHOLD) {
                        // transient kCLErrorLocationUnknown / timeout — ignore, keep waiting
                        console.log(`geolocation transient error (${consecutiveErrors}/${ERROR_THRESHOLD}):`, err.code);
                        return;
                    }

                    // persisted across multiple attempts — now treat as real
                    me({
                        ...me(),
                        completed: true,
                        geolocationAllowed: true,
                        geolocationAvailable: false,
                    });
                },
                { maximumAge: 10000, enableHighAccuracy: false }
            );
        };

        if (navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'denied') {
                    me({ ...me(), geolocationAllowed: false, completed: true });
                    return;
                }

                startWatching();

                result.onchange = () => {
                    const allowed = result.state !== 'denied';
                    me({ ...me(), geolocationAllowed: allowed, completed: true });
                    if (allowed) {
                        consecutiveErrors = 0;
                        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
                        startWatching();
                    }
                };
            });
        } else {
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
    const { data: tsutsykData } = useTsutsyk(tsutsykIds[0]);
    const tsutsyk = tsutsykData?.getTsutsyk;

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

    return <APIProvider libraries={['geometry']} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        {completed ? <Map
            mapId={'bf51a910020fa25a'}
            style={{width: '100vw', height: '100vh'}}
            defaultCenter={position ?? {
                lat: 46.4600902,
                lng: 30.5469775
            }}
            defaultZoom={12}
            gestureHandling='greedy'
            disableDefaultUI
        >
            <Me />
            <Track trail={trail} />
            {latestLocation && (
                <Tsutsyk
                    location={latestLocation}
                    previousLocation={trail.length > 1 ? trail[trail.length - 2] : null}
                    isLive={isLive}
                    photoUrl={tsutsyk?.photoUrl}
                    alertDistanceMeters={tsutsyk?.alertDistanceMeters}
                />
            )}
            <Box className="fixed top-4 right-4">
                <Settings tsutsykId={tsutsykIds[0]} />
            </Box>
            <Box className="fixed bottom-4 right-4">
                <Controls session={session} userAgent={userAgent} location={latestLocation} />
            </Box>
        </Map> : <AbsoluteCenter>
            <Spinner size="xl" />
        </AbsoluteCenter>}
    </APIProvider>
}

export default Tracker;