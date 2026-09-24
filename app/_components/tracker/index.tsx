'use client';
import {APIProvider, Map} from '@vis.gl/react-google-maps';
import {FC} from "react";
import {useTsutsyk, useTsutsykTracking} from "@/app/_lib/useTracker";
import Me from './me'
import Tsutsyk from "@/app/_components/tracker/tsutsyk";
import Track from "@/app/_components/tracker/track";
import AlertAreas from "@/app/_components/tracker/alert-areas";
import {useReactiveVar} from "@apollo/client/react";
import {Alert, Box} from "@chakra-ui/react";
import Controls from "@/app/_components/tracker/controls";
import Settings from "@/app/_components/tracker/settings";
import GeolocationGate from "@/app/_components/tracker/geolocation-gate";
import {me} from "@/app/_lib/me";
import {toLatLng} from "@/app/_lib/geo";
import {useGeolocationWatch} from "@/app/_hooks/useGeolocationWatch";
import type { userAgent } from 'next/server'

// Somewhere in Odesa — only ever seen when we know neither where the ґазда is
// nor where the tsutsyk was last heard from.
const FALLBACK_CENTER = {lat: 46.4600902, lng: 30.5469775};

type TrackerProps = {
    userAgent: ReturnType<typeof userAgent>
}

const Tracker: FC<TrackerProps> = ({ userAgent }) => {
    const { position, tsutsykIds, geolocationAllowed, geolocationAvailable } = useReactiveVar(me);
    const { phase, slow, waiting, retry, stopWaiting } = useGeolocationWatch();

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        throw new Error('Google Maps api key is not provided')
    }

    const { session, trail, isLive, latestLocation } = useTsutsykTracking(tsutsykIds[0]);
    const { data: tsutsykData } = useTsutsyk(tsutsykIds[0]);
    const tsutsyk = tsutsykData?.getTsutsyk;

    if (waiting) {
        return <GeolocationGate
            phase={phase}
            slow={slow}
            userAgent={userAgent}
            onSkip={stopWaiting}
            onRetry={retry}
        />
    }

    return <APIProvider libraries={['geometry']} apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
        <Map
            mapId={'bf51a910020fa25a'}
            style={{width: '100vw', height: '100vh'}}
            // Read once, when the map mounts: whoever we can actually place —
            // the ґазда, else the tsutsyk — decides where it opens.
            defaultCenter={position ?? (latestLocation ? toLatLng(latestLocation) : FALLBACK_CENTER)}
            defaultZoom={12}
            gestureHandling='greedy'
            disableDefaultUI
        >
            <Me />
            <AlertAreas tsutsykId={tsutsykIds[0]} />
            <Track trail={trail} />
            {latestLocation && (
                <Tsutsyk
                    location={latestLocation}
                    previousLocation={trail.length > 1 ? trail[trail.length - 2] : null}
                    isLive={isLive}
                    name={tsutsyk?.name}
                    photoUrl={tsutsyk?.photoUrl}
                    alertDistanceMeters={tsutsyk?.alertDistanceMeters}
                />
            )}
            {!geolocationAvailable && (
                // Without this the only trace of a missing fix is a disabled
                // "До мене" button and a marker that never appears.
                <Box className="fixed top-4 left-4" maxW="15rem">
                    <Alert.Root status="info" variant="surface">
                        <Alert.Content>
                            <Alert.Title>Вашої позиції не видно</Alert.Title>
                            <Alert.Description fontSize="xs">
                                {geolocationAllowed
                                    ? 'Пристрій ще шукає сигнал. Мітка з’явиться сама, щойно він його знайде.'
                                    : 'Доступ до геопозиції заблоковано — мапа показує лише цуцика.'}
                            </Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                </Box>
            )}
            <Box className="fixed top-4 right-4">
                <Settings tsutsykId={tsutsykIds[0]} />
            </Box>
            <Box className="fixed bottom-4 right-4">
                <Controls session={session} userAgent={userAgent} location={latestLocation} />
            </Box>
        </Map>
    </APIProvider>
}

export default Tracker;
