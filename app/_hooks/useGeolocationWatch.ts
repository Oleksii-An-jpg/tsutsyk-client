'use client';

import {useCallback, useEffect, useState} from 'react';
import {me, patchMe} from '@/app/_lib/me';

export type GeolocationPhase =
    // The browser's own permission dialog is up: the person is what we're
    // waiting on, not the hardware, so no deadline runs against them.
    | 'prompting'
    // Permission is there, the first fix is still in flight.
    | 'locating'
    // A fix has landed.
    | 'tracking'
    // Permission is there but the device can't produce a fix. The watch stays
    // open, so this can still turn into 'tracking' later.
    | 'unavailable'
    // Permission refused.
    | 'denied';

// A first fix normally lands in a second or two. Past this the device is
// telling us something — a Mac indoors with nothing to trilaterate against, a
// desktop with no radio at all — and it tells us by repeating
// kCLErrorLocationUnknown (POSITION_UNAVAILABLE) rather than by ever failing.
// Waiting on that stream is what left the map behind a spinner forever.
const FIRST_FIX_DEADLINE_MS = 10_000;

// Late enough that a normal fix never flashes the "taking a while" copy.
const SLOW_NOTICE_MS = 3_000;

// A lone POSITION_UNAVAILABLE means nothing — they arrive in bursts, and a fix
// usually follows. Only an unbroken run of them says the device is stuck.
const ERROR_THRESHOLD = 3;

// Without this the browser never times a fix out on its own, so a watch can sit
// silent indefinitely and the deadline above is the only thing that answers.
const POSITION_TIMEOUT_MS = 15_000;

const POSITION_OPTIONS: PositionOptions = {
    maximumAge: 10_000,
    timeout: POSITION_TIMEOUT_MS,
    enableHighAccuracy: false,
};

/**
 * Watches the user's position and, more importantly, bounds how long the UI is
 * allowed to wait for it. Every outcome is reachable in bounded time: a fix, a
 * refusal, or "this device can't say" — never an open-ended wait.
 */
export function useGeolocationWatch() {
    // A position we already hold outlives this component, so a remount (a route
    // change and back) shouldn't put the map behind a spinner again.
    const [phase, setPhase] = useState<GeolocationPhase>(() => me().position ? 'tracking' : 'locating');
    const [slow, setSlow] = useState(false);
    const [waived, setWaived] = useState(false);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        let cancelled = false;
        let watchId: number | null = null;
        let permission: PermissionStatus | null = null;
        let slowTimer: ReturnType<typeof setTimeout> | undefined;
        let deadlineTimer: ReturnType<typeof setTimeout> | undefined;
        let consecutiveErrors = 0;
        let located = false;

        const clearTimers = () => {
            clearTimeout(slowTimer);
            clearTimeout(deadlineTimer);
            slowTimer = undefined;
            deadlineTimer = undefined;
        };

        // Giving up on the wait is not giving up on the watch: the map opens
        // without us, the watch stays live, and a fix that turns up two minutes
        // later still drops the marker in place.
        const giveUp = () => {
            if (cancelled) return;
            clearTimers();
            patchMe({geolocationAvailable: false});
            setSlow(false);
            setPhase('unavailable');
        };

        // Says "this is taking a while" and, with it, offers the way past the
        // wait. It runs while the permission dialog is up too: a dialog can be
        // dismissed by a stray tap, and nothing else would ever come back.
        const startSlowNotice = () => {
            if (located) return;
            slowTimer = setTimeout(() => {
                if (!cancelled) setSlow(true);
            }, SLOW_NOTICE_MS);
        };

        const startCountdown = () => {
            clearTimers();
            if (located) return;
            startSlowNotice();
            deadlineTimer = setTimeout(giveUp, FIRST_FIX_DEADLINE_MS);
        };

        const startWatching = () => {
            if (cancelled || watchId !== null) return;
            watchId = navigator.geolocation.watchPosition(
                ({coords: {latitude: lat, longitude: lng}}) => {
                    if (cancelled) return;
                    consecutiveErrors = 0;
                    located = true;
                    clearTimers();

                    const current = me();
                    if (current.position?.lat !== lat || current.position?.lng !== lng) {
                        me({...current, position: {lat, lng}, geolocationAllowed: true, geolocationAvailable: true});
                    } else {
                        patchMe({geolocationAllowed: true, geolocationAvailable: true});
                    }

                    setSlow(false);
                    setPhase('tracking');
                },
                (error) => {
                    if (cancelled) return;

                    if (error.code === error.PERMISSION_DENIED) {
                        clearTimers();
                        patchMe({geolocationAllowed: false, geolocationAvailable: false});
                        setPhase('denied');
                        return;
                    }

                    consecutiveErrors += 1;
                    if (consecutiveErrors < ERROR_THRESHOLD) return;
                    giveUp();
                },
                POSITION_OPTIONS,
            );
        };

        const apply = () => {
            if (cancelled || !permission) return;

            if (permission.state === 'denied') {
                clearTimers();
                patchMe({geolocationAllowed: false, geolocationAvailable: false});
                setPhase('denied');
                return;
            }

            patchMe({geolocationAllowed: true});
            // Starting the watch is what raises the permission dialog, so this
            // has to happen in the 'prompt' state too.
            startWatching();

            if (located) return;

            if (permission.state === 'prompt') {
                // No deadline while the dialog is open: it would time out the
                // person for reading it. The notice still runs, so the wait
                // stays escapable if the dialog never gets answered.
                clearTimers();
                startSlowNotice();
                setPhase('prompting');
                return;
            }

            setPhase('locating');
            startCountdown();
        };

        // Safari and some webviews reject the geolocation descriptor outright;
        // there the watch itself is the only source of truth. The phase is
        // already 'locating' here, so there is nothing to set.
        const withoutPermissionApi = () => {
            if (cancelled) return;
            startWatching();
            startCountdown();
        };

        if (!navigator.geolocation) {
            // No API at all — an ancient browser or an exotic webview. Same
            // outcome as a device that can't locate itself, reached through the
            // same path rather than by setting state from the effect body.
            deadlineTimer = setTimeout(giveUp, 0);
        } else if (navigator.permissions?.query) {
            navigator.permissions.query({name: 'geolocation'}).then(
                (status) => {
                    // The query resolves a tick later than the effect's cleanup
                    // can run. Without this guard StrictMode leaves an orphaned
                    // watch behind, which is how a single device ended up
                    // reporting its errors twice over.
                    if (cancelled) return;
                    permission = status;
                    status.onchange = apply;
                    apply();
                },
                withoutPermissionApi,
            );
        } else {
            withoutPermissionApi();
        }

        return () => {
            cancelled = true;
            clearTimers();
            if (permission) permission.onchange = null;
            if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        };
    }, [attempt]);

    // A dismissed dialog reads as a denial, and browsers won't re-prompt from a
    // dead page — but a fresh watch does ask again, so offer that before
    // sending anyone into their browser settings.
    const retry = useCallback(() => {
        setPhase('locating');
        setSlow(false);
        setWaived(false);
        setAttempt((n) => n + 1);
    }, []);

    const stopWaiting = useCallback(() => setWaived(true), []);

    return {
        phase,
        slow,
        // Whether the map still has to wait on us. 'unavailable' deliberately
        // isn't waiting: the tsutsyk is the reason the map exists, and it can
        // be shown without knowing where its ґазда stands.
        waiting: !waived && phase !== 'tracking' && phase !== 'unavailable',
        retry,
        stopWaiting,
    };
}
