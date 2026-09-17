import {AirRaidStatus} from "@/app/_documents/__generated__/globalTypes.codegen";

// Keep these in step with the API's reporting policy
// (tsutsyk-api/src/tracker/reporting-policy.ts): the copy promises a cadence,
// so it has to be the cadence the server actually asks the tracker for.
const ALERT_CADENCE = "Трекер оновлює позицію щохвилини.";
const NORMAL_CADENCE = "Звичайний режим — раз на 5 хвилин.";

export type AirRaidPresentation = {
    label: string;
    detail: string;
    colorPalette: string;
};

export const AIR_RAID: Record<AirRaidStatus, AirRaidPresentation> = {
    [AirRaidStatus.Active]: {
        label: "Повітряна тривога",
        detail: ALERT_CADENCE,
        colorPalette: "red",
    },
    [AirRaidStatus.Partly]: {
        label: "Тривога в частині області",
        detail: ALERT_CADENCE,
        colorPalette: "orange",
    },
    [AirRaidStatus.NoAlert]: {
        label: "Тривоги немає",
        detail: NORMAL_CADENCE,
        colorPalette: "green",
    },
    // Never "тривоги немає". We do not know, and saying otherwise would be a
    // promise the tracker is not keeping — which is the whole reason the API
    // reports UNKNOWN separately instead of folding it into NO_ALERT.
    [AirRaidStatus.Unknown]: {
        label: "Невідомо",
        detail: "Немає зв'язку зі службою тривог, або область не вибрано.",
        colorPalette: "gray",
    },
};
