import {defineStyle} from "@chakra-ui/react";

export type MarkerStatus = "active" | "idle" | "alert";

export const MARKER_STATUS_COLOR_PALETTE: Record<MarkerStatus, string> = {
    active: "green",
    idle: "orange",
    alert: "red",
};

export const ringCss = defineStyle({
    outlineWidth: "2px",
    outlineColor: "colorPalette.500",
    outlineOffset: "2px",
    outlineStyle: "solid",
    color: "colorPalette.500",
    filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.35))",
    transition: "outline-color 0.2s ease-in-out",
});
