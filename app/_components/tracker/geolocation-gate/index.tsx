'use client';

import {FC} from 'react';
import {AbsoluteCenter, Alert, Button, HStack, Spinner, Text, VStack} from '@chakra-ui/react';
import type {userAgent} from 'next/server';
import type {GeolocationPhase} from '@/app/_hooks/useGeolocationWatch';

type GeolocationGateProps = {
    phase: GeolocationPhase;
    slow: boolean;
    userAgent: ReturnType<typeof userAgent>;
    onSkip: () => void;
    onRetry: () => void;
};

function settingsHint(ua: ReturnType<typeof userAgent>) {
    if (ua.device.vendor === 'Apple') {
        return 'Налаштування → Safari → Геопозиція → Дозволити';
    }
    if (ua.browser.name === 'Firefox') {
        return 'Замок у рядку адреси → З’єднання захищене → Детальніше → Дозволи';
    }
    return 'Замок у рядку адреси → Налаштування сайту → Геопозиція → Дозволити';
}

const Blocked: FC<Pick<GeolocationGateProps, 'userAgent' | 'onSkip' | 'onRetry'>> = ({userAgent, onSkip, onRetry}) => (
    <AbsoluteCenter textAlign="center" px={8}>
        <VStack gap={4} maxW="sm">
            <Alert.Root status="warning" variant="subtle">
                <Alert.Content>
                    <Alert.Title>Доступ до геопозиції заблоковано</Alert.Title>
                    <Alert.Description>
                        <VStack gap={2}>
                            <Text fontSize="sm">
                                Без нього ми не покажемо, де ви — але мапа з цуциком працює й так.
                            </Text>
                            <Text fontSize="sm" color="fg.muted">
                                {settingsHint(userAgent)}
                            </Text>
                        </VStack>
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
            <HStack gap={2} wrap="wrap" justify="center">
                <Button size="sm" variant="outline" onClick={onRetry}>
                    Спробувати ще раз
                </Button>
                <Button size="sm" colorPalette="blue" onClick={onSkip}>
                    Показати мапу
                </Button>
            </HStack>
        </VStack>
    </AbsoluteCenter>
);

const Locating: FC<Pick<GeolocationGateProps, 'phase' | 'slow' | 'onSkip'>> = ({phase, slow, onSkip}) => (
    <AbsoluteCenter textAlign="center" px={8}>
        <VStack gap={3} maxW="sm">
            <Spinner size="xl" />
            <Text fontWeight="medium">
                {phase === 'prompting' ? 'Дозвольте доступ до геопозиції' : 'Шукаємо, де ви зараз…'}
            </Text>
            <Text fontSize="sm" color="fg.muted">
                {phase === 'prompting'
                    ? 'Браузер щойно запитав дозвіл — натисніть «Дозволити», і мапа відкриється.'
                    : slow
                        ? 'Пристрій не може себе знайти — так буває в приміщенні або без Wi-Fi. Мапу з цуциком можна відкрити вже зараз.'
                        : 'Це займе кілька секунд.'}
            </Text>
            {slow && (
                <Button size="sm" variant="outline" onClick={onSkip}>
                    Показати мапу без моєї позиції
                </Button>
            )}
        </VStack>
    </AbsoluteCenter>
);

// Everything that can stand between the ґазда and the map: the permission
// dialog, the first fix, or a refusal. Each state says what is happening and,
// once waiting stops being reasonable, offers the way past it — the tsutsyk is
// on the map whether or not we ever learn where its ґазда is.
const GeolocationGate: FC<GeolocationGateProps> = ({phase, slow, userAgent, onSkip, onRetry}) =>
    phase === 'denied'
        ? <Blocked userAgent={userAgent} onSkip={onSkip} onRetry={onRetry} />
        : <Locating phase={phase} slow={slow} onSkip={onSkip} />;

export default GeolocationGate;
