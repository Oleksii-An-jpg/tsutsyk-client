import type { DriveStep } from "driver.js";

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
    const start = async () => {
        // driver.js touches `document`, so it must be imported client-side only
        const { driver } = await import("driver.js");
        await import("driver.js/dist/driver.css");

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
        });

        driverObj.drive();
    };

    return { start };
}
