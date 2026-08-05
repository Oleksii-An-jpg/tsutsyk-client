import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";

export type LatLngLiteral = { lat: number; lng: number };

export function toLatLng(location: Location): LatLngLiteral {
    return {lat: location.latitude, lng: location.longitude};
}

export type Movement = {
    distanceMeters: number;
    speedMetersPerSecond: number;
    bearingDeg: number;
};

export function computeMovement(from: Location, to: Location): Movement {
    const fromPoint = toLatLng(from);
    const toPoint = toLatLng(to);
    const distanceMeters = google.maps.geometry.spherical.computeDistanceBetween(fromPoint, toPoint);
    const seconds = (new Date(to.timestamp).getTime() - new Date(from.timestamp).getTime()) / 1000;
    return {
        distanceMeters,
        speedMetersPerSecond: seconds > 0 ? distanceMeters / seconds : 0,
        bearingDeg: google.maps.geometry.spherical.computeHeading(fromPoint, toPoint),
    };
}
