"use client";

import {useCallback, useState, useSyncExternalStore} from "react";

/**
 * The event Chromium fires once it has decided this app is installable.
 *
 * It is not in lib.dom — no other engine ships it — so the shape here is the
 * one the spec draft describes and the one Chrome, Edge and Samsung Internet
 * actually hand over.
 */
export interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: "accepted" | "dismissed";
        platform: string;
    }>;
    prompt(): Promise<void>;
}

declare global {
    interface Window {
        /**
         * Where the snippet in the root layout parks the event. It fires once
         * per page load, and it can fire before React has hydrated — a
         * listener attached on mount would simply never hear it, and the
         * button would sit there dead for the life of the page.
         */
        __installPrompt?: BeforeInstallPromptEvent;
    }

    interface Navigator {
        /** Safari's own "launched from the home screen" flag. */
        standalone?: boolean;
    }
}

/**
 * The display mode the manifest asks for. Made once and kept, so the snapshot
 * below and the subscription are reading the same query rather than two.
 */
let standaloneQuery: MediaQueryList | undefined;

function standalone(): MediaQueryList {
    return (standaloneQuery ??= window.matchMedia("(display-mode: standalone)"));
}

/**
 * Whether this page is already the installed app rather than a tab.
 *
 * Chromium answers through the display-mode media query. iOS has never
 * implemented it, so `navigator.standalone` is the only way to tell a
 * home-screen launch from Safari there.
 */
function launchedAsApp(): boolean {
    return standalone().matches || navigator.standalone === true;
}

/**
 * iOS — including an iPad that claims to be a Mac.
 *
 * iPadOS 13 started reporting "Macintosh" in the user agent; a touch screen is
 * the tell that it is not one. WebKit is the whole platform there, so this
 * covers every browser on the device rather than only Safari: Chrome and
 * Firefox on iOS are Safari underneath, share the same missing
 * `beforeinstallprompt`, and install through the same share sheet.
 */
function isIOS(): boolean {
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
    );
}

/**
 * What the browser is offering. Everything here is the browser's state, not
 * React's — the event it handed over, the display mode it is drawing in, the
 * engine it is — so it is read through `useSyncExternalStore` rather than
 * copied into state on mount.
 */
export type InstallSignal =
    // Server render, and the hydrating one: nothing above can be asked yet.
    | "checking"
    // Running as the installed app. There is nothing left to offer.
    | "installed"
    // A `beforeinstallprompt` event is in hand: one click installs.
    | "available"
    // No prompt to fire, but this browser installs by hand — iOS and its
    // share sheet. The button explains instead of installing.
    | "manual"
    // Nothing to offer: a browser with no install at all, or one that has not
    // decided the app is installable.
    | "unavailable";

/**
 * Remembers an install this page saw happen.
 *
 * `appinstalled` fires in the tab that did the installing, which carries on
 * being an ordinary tab — the display mode does not change under it, so
 * nothing else would remember.
 */
let installedHere = false;

const listeners = new Set<() => void>();

function notify() {
    for (const listener of listeners) listener();
}

function read(): InstallSignal {
    if (installedHere || launchedAsApp()) return "installed";
    if (window.__installPrompt) return "available";
    return isIOS() ? "manual" : "unavailable";
}

/** Nothing is knowable until there is a browser to ask. */
function readOnServer(): InstallSignal {
    return "checking";
}

function subscribe(onChange: () => void): () => void {
    listeners.add(onChange);

    const onPrompt = (incoming: Event) => {
        // Holds Chromium's own install banner back so the offer is ours to
        // place. Chromium fires this again after a refusal — a later visit,
        // and sometimes the same one — and only the newest event can be
        // prompted with, so it replaces whatever was parked.
        incoming.preventDefault();
        window.__installPrompt = incoming as BeforeInstallPromptEvent;
        notify();
    };

    const onInstalled = () => {
        // Also covers an install done from the browser's own menu, which never
        // goes near our button.
        installedHere = true;
        window.__installPrompt = undefined;
        notify();
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    // Someone can end up with this very tab adopted by the app window; the
    // display mode is what notices, since no click of ours was involved.
    standalone().addEventListener("change", notify);

    return () => {
        listeners.delete(onChange);
        window.removeEventListener("beforeinstallprompt", onPrompt);
        window.removeEventListener("appinstalled", onInstalled);
        standalone().removeEventListener("change", notify);
    };
}

export type InstallPhase = InstallSignal | "working";

/**
 * The install button's whole state.
 *
 * Installing is the browser's to do, not ours: the most an app can do is ask
 * at a moment that makes sense. Chromium lets us hold its prompt back and fire
 * it from a real button; iOS has no such API, so there the honest answer is to
 * say where the share sheet is. Everywhere else there is nothing to render —
 * offering an install that cannot happen is worse than offering nothing.
 */
export function useInstallPrompt() {
    const signal = useSyncExternalStore(subscribe, read, readOnServer);
    // The only part of this that is ours rather than the browser's: its
    // dialog is up and we are waiting to hear back.
    const [prompting, setPrompting] = useState(false);

    const promptInstall = useCallback(async () => {
        const event = window.__installPrompt;
        if (!event) return;
        setPrompting(true);

        try {
            await event.prompt();
            const {outcome} = await event.userChoice;

            // Spent either way: one event is good for exactly one prompt, and
            // firing it twice throws. Chromium mints a fresh one when it is
            // ready to ask again — so a no hides the button rather than
            // leaving it to be clicked into an error, and the offer comes back
            // on the next visit instead of nagging on this one.
            window.__installPrompt = undefined;
            // `appinstalled` says the same thing a moment later; this is just
            // not making the button wait for it.
            if (outcome === "accepted") installedHere = true;
        } catch (error) {
            // Prompting outside a user gesture, or with an event the browser
            // has already retired. Neither is worth a broken-looking button.
            window.__installPrompt = undefined;
            console.error("[install] prompt failed", error);
        } finally {
            setPrompting(false);
            notify();
        }
    }, []);

    return {
        phase: prompting ? ("working" as const) : signal,
        /** Already running as the installed app. */
        installed: signal === "installed",
        /** No prompt to fire — the button has to explain the share sheet. */
        manual: signal === "manual",
        promptInstall,
    };
}
