'use client';
import {FC} from "react";
import {IconButton} from "@chakra-ui/react";
import {BiBell, BiBellOff, BiBellMinus} from "react-icons/bi";
import {usePushNotifications} from "@/app/_lib/usePush";

const LABELS: Record<string, string> = {
    checking: 'Перевіряємо…',
    unsupported: 'Цей браузер не вміє сповіщень',
    denied: 'Сповіщення заблоковані в налаштуваннях браузера',
    idle: 'Увімкнути сповіщення',
    subscribed: 'Вимкнути сповіщення',
    working: 'Зачекайте…',
};

const PushNotificationManager: FC = () => {
    const {phase, configured, subscribed, subscribe, unsubscribe} =
        usePushNotifications();

    // Nothing to turn on when the API has no keys to sign a send with, and
    // nothing to re-ask when the browser has already been told no.
    const disabled =
        !configured ||
        phase === 'checking' ||
        phase === 'working' ||
        phase === 'unsupported' ||
        phase === 'denied';

    return (
        <IconButton
            title={configured ? LABELS[phase] : 'Сповіщення поки недоступні'}
            disabled={disabled}
            data-tour="push-notification"
            onClick={subscribed ? unsubscribe : subscribe}
            colorPalette="yellow"
        >
            {disabled ? <BiBellMinus/> : subscribed ? <BiBellOff/> : <BiBell/>}
        </IconButton>
    );
};

export default PushNotificationManager;
