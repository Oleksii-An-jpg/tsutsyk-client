"use client";

import {useCallback, useEffect, useState} from "react";
import {useMutation, useQuery} from "@apollo/client/react";
import {QUERY_PUSH_CONFIG} from "@/app/_documents/QUERY_PUSH_CONFIG";
import {
    PushConfigQuery,
    PushConfigQueryVariables,
} from "@/app/_documents/__generated__/QUERY_PUSH_CONFIG.codegen";
import {MUTATION_SAVE_PUSH_SUBSCRIPTION} from "@/app/_documents/MUTATION_SAVE_PUSH_SUBSCRIPTION";
import {
    SavePushSubscriptionMutation,
    SavePushSubscriptionMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_SAVE_PUSH_SUBSCRIPTION.codegen";
import {MUTATION_DELETE_PUSH_SUBSCRIPTION} from "@/app/_documents/MUTATION_DELETE_PUSH_SUBSCRIPTION";
import {
    DeletePushSubscriptionMutation,
    DeletePushSubscriptionMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_DELETE_PUSH_SUBSCRIPTION.codegen";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Pulls the two keys out of a PushSubscription.
 *
 * `toJSON()` is the only way to read them as strings — `getKey()` hands back
 * an ArrayBuffer — and it is what the browser itself considers the wire form.
 */
function toInput(subscription: PushSubscription) {
    const {endpoint, keys} = subscription.toJSON() as {
        endpoint?: string;
        keys?: { p256dh?: string; auth?: string };
    };
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error("the browser produced a subscription with no keys");
    }
    return {endpoint, p256dh: keys.p256dh, auth: keys.auth};
}

/**
 * Whether this browser has already been told no.
 *
 * Read defensively: `Notification` is a separate API from `PushManager`, and
 * a browser can carry one without the other. Treating its absence as "not
 * denied" is the harmless way round — the subscribe call is what would fail,
 * and it fails into the same state.
 */
function permissionDenied(): boolean {
    return typeof Notification !== "undefined" && Notification.permission === "denied";
}

export type PushPhase =
    // Still finding out whether this browser can do any of this.
    | "checking"
    // No service worker, no PushManager, or the API has no VAPID keys — the
    // toggle has nothing to offer and says so by staying disabled.
    | "unsupported"
    // Ready, and nobody is subscribed on this browser yet.
    | "idle"
    // Subscribed. The API can reach this browser.
    | "subscribed"
    // The browser's permission prompt was refused. Nothing we do re-opens it.
    | "denied"
    | "working";

/**
 * The notification toggle's whole state.
 *
 * Subscribing is two steps that have to both land: the browser mints a
 * subscription, and the API is told about it. A subscription the API never
 * heard of is a browser that will never be pushed to, so a failed `save`
 * unsubscribes rather than leaving the toggle looking on.
 */
export function usePushNotifications() {
    const [phase, setPhase] = useState<PushPhase>("checking");
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);

    const {data: config} = useQuery<PushConfigQuery, PushConfigQueryVariables>(
        QUERY_PUSH_CONFIG,
    );
    const publicKey = config?.getPushConfig?.publicKey ?? null;

    const [save] = useMutation<
        SavePushSubscriptionMutation,
        SavePushSubscriptionMutationVariables
    >(MUTATION_SAVE_PUSH_SUBSCRIPTION);
    const [forget] = useMutation<
        DeletePushSubscriptionMutation,
        DeletePushSubscriptionMutationVariables
    >(MUTATION_DELETE_PUSH_SUBSCRIPTION);

    useEffect(() => {
        let cancelled = false;

        async function register() {
            if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
                if (!cancelled) setPhase("unsupported");
                return;
            }

            const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/me",
                updateViaCache: "none",
            });
            const existing = await registration.pushManager.getSubscription();
            if (cancelled) return;

            setSubscription(existing);
            // A permission already refused is worth saying out loud: the
            // browser will not re-prompt, so an enabled-looking button would
            // do nothing, twice.
            if (permissionDenied()) {
                setPhase("denied");
                return;
            }
            setPhase(existing ? "subscribed" : "idle");
        }

        register().catch(() => {
            if (!cancelled) setPhase("unsupported");
        });

        return () => {
            cancelled = true;
        };
    }, []);

    const subscribe = useCallback(async () => {
        if (!publicKey) return;
        setPhase("working");

        let fresh: PushSubscription | null = null;
        try {
            const registration = await navigator.serviceWorker.ready;
            fresh = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
            await save({variables: {input: toInput(fresh)}});
            setSubscription(fresh);
            setPhase("subscribed");
        } catch (error) {
            // The browser minted a subscription but the API never heard about
            // it: hand it back, or this browser sits on a subscription nothing
            // will ever push to while the toggle claims otherwise.
            await fresh?.unsubscribe().catch(() => undefined);
            setSubscription(null);
            setPhase(permissionDenied() ? "denied" : "idle");
            console.error("[push] subscribe failed", error);
        }
    }, [publicKey, save]);

    const unsubscribe = useCallback(async () => {
        if (!subscription) return;
        setPhase("working");
        const {endpoint} = subscription;

        try {
            await subscription.unsubscribe();
            // Told after the fact rather than before: a forgotten row whose
            // browser still holds a live subscription is a notification
            // somebody asked us to stop sending.
            await forget({variables: {endpoint}});
        } catch (error) {
            console.error("[push] unsubscribe failed", error);
        } finally {
            setSubscription(null);
            setPhase("idle");
        }
    }, [forget, subscription]);

    return {
        phase,
        // Whether the API has keys at all. Without them nothing can be sent,
        // so the toggle has nothing to turn on.
        configured: publicKey !== null,
        subscribed: phase === "subscribed",
        subscribe,
        unsubscribe,
    };
}
