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

// The tour is a greeting, not a feature: once it has been raised it stays down,
// including after a reload or a trip through the back button. Kept in
// localStorage because component state dies with the mount it lived on, and a
// back navigation is exactly a fresh mount.
const SEEN_STORAGE_KEY = "tsutsyk:onboarding-tour-seen";

const hasSeenTour = () => {
    try {
        return window.localStorage.getItem(SEEN_STORAGE_KEY) === "1";
    } catch {
        // Private mode and locked-down storage throw on access. Nothing to
        // remember with, so the tour simply behaves as it did before.
        return false;
    }
};

const rememberTour = () => {
    try {
        window.localStorage.setItem(SEEN_STORAGE_KEY, "1");
    } catch {
        // See above — not remembering is survivable, failing to start is not.
    }
};
// ---------------------------------------------------------------------------

export function useOnboardingTour(steps: TourStep[] = tsutsykTourSteps) {
    const driverRef = useRef<Driver | null>(null);
    // Set the moment a tour is asked for, not when driver.js finally lands, so
    // a teardown that happens while the chunk is still loading is still seen by
    // the code that resolves after it.
    const activeRef = useRef(false);

    const stop = useCallback(() => {
        activeRef.current = false;
        const driverObj = driverRef.current;
        driverRef.current = null;
        driverObj?.destroy();
    }, []);

    const start = useCallback(async () => {
        // A tour already running, or one this person has already been walked
        // through: either way there is nothing to raise.
        if (activeRef.current || hasSeenTour()) return;

        activeRef.current = true;
        // Marked as seen at the start rather than at the end: someone who walks
        // away mid-tour has still been shown it, and leaving the mark until the
        // last step is what let the back button replay it.
        rememberTour();

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

        return () => {
            window.removeEventListener("pagehide", handleNavigation);
            window.removeEventListener("popstate", handleNavigation);
            stop();
        };
    }, [stop]);

    return { start, stop };
}
