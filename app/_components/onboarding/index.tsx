'use client';

import {FC} from 'react';
import {AbsoluteCenter, Alert, Container, Spinner} from '@chakra-ui/react';
import {useReactiveVar} from '@apollo/client/react';
import {me} from '@/app/_lib/me';
import {useAdminAuth} from '@/app/_hooks/useAdminAuth';
import {useTsutsykPublicProfile} from '@/app/_lib/useTracker';
import AuthStep from './auth-step';
import ClaimForm from './claim-form';
import PublicProfile from './public-profile';

type OnboardingProps = {
    id: string;
};

// tsutsyk.live/tsutsyk/<id> — the landing page for a physical unit's QR code.
// First scan: auth, then name+photo, then off to /me. Every scan after
// that: a public read-only profile, no auth required.
const Onboarding: FC<OnboardingProps> = ({id}) => {
    useAdminAuth();
    const {checked, authenticated} = useReactiveVar(me);
    const {data, loading} = useTsutsykPublicProfile(id);
    const profile = data?.getTsutsykPublicProfile;

    if (loading || !checked) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    if (!profile) {
        return (
            <Container maxW="md" py={16}>
                <Alert.Root status="error">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Цуцика не знайдено</Alert.Title>
                        <Alert.Description>
                            Перевірте, чи правильно відскановано QR-код.
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            </Container>
        );
    }

    if (profile.claimed) {
        return <PublicProfile profile={profile} />;
    }

    return (
        <Container maxW="2xl" py={16}>
            {authenticated ? <ClaimForm id={id} /> : <AuthStep />}
        </Container>
    );
};

export default Onboarding;
