'use client';
import {useBoolean} from "usehooks-ts";
import {FC, useEffect, useState} from "react";
import {subscribeUser, unsubscribeUser} from "@/app/actions";
import {IconButton} from "@chakra-ui/react";
import {BiBell, BiBellOff, BiBellMinus} from "react-icons/bi";

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

const PushNotificationManager: FC = () => {
    const { value, setTrue } = useBoolean(false);
    const [subscription, setSubscription] = useState<PushSubscription | null>(
        null
    )

    useEffect(() => {
        let cancelled = false

        async function registerServiceWorker() {
            if (!('serviceWorker' in navigator && 'PushManager' in window)) return

            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/me',
                updateViaCache: 'none',
            })
            const sub = await registration.pushManager.getSubscription()

            if (!cancelled) {
                setTrue();
                setSubscription(sub)
            }
        }

        registerServiceWorker()

        return () => {
            cancelled = true
        }
    }, [setTrue]);

    async function subscribeToPush() {
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
            ),
        })
        setSubscription(sub)
        const serializedSub = JSON.parse(JSON.stringify(sub))
        await subscribeUser(serializedSub)
    }

    async function unsubscribeFromPush() {
        await subscription?.unsubscribe()
        setSubscription(null)
        await unsubscribeUser()
    }

    if (!value) {
        return <IconButton disabled rounded="full" colorPalette="yellow">
            <BiBellMinus />
        </IconButton>
    }

    return (
        <IconButton data-tour="push-notification" onClick={subscription ? unsubscribeFromPush : subscribeToPush} rounded="full" colorPalette="yellow">
            {subscription ? <BiBellOff /> : <BiBell />}
        </IconButton>
    )
}

export default PushNotificationManager;
