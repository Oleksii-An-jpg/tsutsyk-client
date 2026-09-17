'use client';

import {useCallback, useEffect, useRef} from "react";
import type { Driver, DriveStep } from "driver.js";

export interface TourStep {
    target: string; // CSS selector, e.g. '[data-tour="geofence-panel"]'
    title: string;
    description: string;
}

export const tsutsykTourSteps: TourStep[] = [
    {
        target: '[data-tour="push-notification"]',
        title: "Push-нотифікації 🔔",
        description: "Умикай, щоб завжди знати, чи цуцик поруч, чи вже пішов у пригоди!",
    },
    {
        target: '[data-tour="stop-session"]',
        title: "Завершити сесію",
        description: "Тисни сюди, коли прилад вимкнено або прогулянка вже закінчилась.",
    },
    {
        target: '[data-tour="focus-tsutsyk"]',
        title: "До цуцика 🐾",
        description: "Одна мить — і мапа сама знайде, де зараз твій хвостик!",
    },
    {
        target: '[data-tour="focus-me"]',
        title: "До мене 📍",
        description: "Швиденько повертає мапу туди, де знаходишся ти.",
    },
];
// ---------------------------------------------------------------------------

export function useOnboardingTour(steps: TourStep[] = tsutsykTourSteps) {
    const driverRef = useRef<Driver | null>(null);
    // Set the moment a tour is asked for, not when driver.js finally lands, so
    // a teardown that happens while the chunk is still loading is still seen by
    // the code that resolves after it.
    const activeRef = useRef(false);
    // Whether this mount has raised a tour at all — the only thing a bfcache
    // restore can go on, since nothing remounts to ask for one.
    const raisedRef = useRef(false);

    const stop = useCallback(() => {
        activeRef.current = false;
        const driverObj = driverRef.current;
        driverRef.current = null;
        driverObj?.destroy();
    }, []);

    const start = useCallback(async () => {
        // Nothing is remembered between mounts: the tour greets every arrival on
        // the map, and the only tour it won't raise is a second one on top of
        // the one already up.
        if (activeRef.current) return;

        activeRef.current = true;
        raisedRef.current = true;

        // driver.js touches `document`, so it must be imported client-side only
        const { driver } = await import("driver.js");
        await import("driver.js/dist/driver.css");

        // Stopped while those chunks were in flight — an unmount, or
        // StrictMode's second mount arriving first.
        if (!activeRef.current) return;

        const driveSteps: DriveStep[] = steps.map((step) => ({
            element: step.target,
            popover: {
                title: step.title,
                description: step.description,
            },
        }));

        const driverObj = driver({
            allowClose: true,
            overlayColor: "black",
            prevBtnText: '← Назад',
            nextBtnText: 'Далі →',
            doneBtnText: 'Готово! 🐾',
            overlayOpacity: 0.65,
            stagePadding: 6,
            stageRadius: 8,
            steps: driveSteps,
            onDestroyStarted: () => {
                driverObj.destroy();
            },
            onDestroyed: () => {
                // driver.js also tears itself down on Esc, on the overlay and
                // on "Готово", so the refs are cleared here too — otherwise
                // stop() would later destroy an instance that is already gone.
                driverRef.current = null;
                activeRef.current = false;
            },
        });

        driverRef.current = driverObj;
        driverObj.drive();
    }, [steps]);

    useEffect(() => {
        // driver.js paints its overlay and popover straight onto document.body,
        // outside React's tree, so React unmounting the buttons underneath does
        // not take the tour with them. Leaving the map — a route change, the
        // back button — would otherwise strand the highlight on top of a page
        // that no longer has anything to highlight.
        const handleNavigation = () => stop();

        // Back to a previous document: with bfcache the page is restored whole,
        // overlay included, so it has to come down before the page is frozen.
        window.addEventListener("pagehide", handleNavigation);
        // Back within this route (a pushed dialog, a hash) unmounts nothing, so
        // the cleanup below never runs and this is the only signal there is.
        window.addEventListener("popstate", handleNavigation);

        // The other half of that bfcache trip: the page comes back exactly as
        // it was frozen, minus the tour taken down on the way out, and React
        // remounts nothing — so this is the only chance to greet someone
        // walking back onto the map.
        const handleRestore = (event: PageTransitionEvent) => {
            if (event.persisted && raisedRef.current) void start();
        };
        window.addEventListener("pageshow", handleRestore);

        return () => {
            window.removeEventListener("pagehide", handleNavigation);
            window.removeEventListener("popstate", handleNavigation);
            window.removeEventListener("pageshow", handleRestore);
            stop();
        };
    }, [start, stop]);

    return { start, stop };
}
