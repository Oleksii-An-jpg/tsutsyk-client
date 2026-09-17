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
        target: '[data-tour="install-app"]',
        title: "Застосунок на телефоні 📲",
        description: "Встанови Tsutsyk Live на головний екран — відкривається з одного тику, а на iPhone тільки так працюють сповіщення.",
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

        // driver.js touches `document`, so it must be imported client-side only
        const { driver } = await import("driver.js");
        await import("driver.js/dist/driver.css");

        // Stopped while those chunks were in flight — an unmount, or
        // StrictMode's second mount arriving first.
        if (!activeRef.current) return;

        // A step whose element is not on screen is not skipped by driver.js —
        // it puts the popover in the middle of the page with nothing
        // highlighted. The install button is the one control here that comes
        // and goes (it is gone once the app is installed), so the steps are
        // filtered against the DOM rather than assumed.
        const driveSteps: DriveStep[] = steps
            .filter((step) => document.querySelector(step.target))
            .map((step) => ({
                element: step.target,
                popover: {
                    title: step.title,
                    description: step.description,
                },
            }));

        // Nothing left to point at — an empty tour is driver.js throwing.
        if (driveSteps.length === 0) {
            activeRef.current = false;
            return;
        }

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

    // driver.js paints its overlay and popover straight onto document.body,
    // outside React's tree, so React taking the buttons away does not take the
    // tour with them. Every way off the map is a client-side navigation, which
    // unmounts this hook along with those buttons — so the cleanup *is* the
    // navigation subscription, and the overlay goes when they do.
    useEffect(() => stop, [stop]);

    return { start, stop };
}
