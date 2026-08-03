'use client';

import {FC, useState} from 'react';
import {
    Alert,
    Button,
    Card,
    Center,
    Heading,
    Spinner,
    Text,
    VStack,
} from '@chakra-ui/react';
import Link from 'next/link';
import {useReactiveVar} from '@apollo/client/react';
import {CombinedGraphQLErrors} from '@apollo/client/errors';
import {auth} from '@/app/_lib/firebase';
import {me} from '@/app/_lib/me';
import {useAdminAuth} from '@/app/_hooks/useAdminAuth';
import {useClaimGadget, useGadgetStatus} from '@/app/_lib/useTracker';
import {POST_AUTH_REDIRECT_KEY} from '@/app/_lib/postAuthRedirect';

type ClaimGadgetProps = {
    gadgetId: string;
};

function extractErrorMessage(err: unknown): string {
    if (CombinedGraphQLErrors.is(err)) {
        return err.errors[0]?.message ?? 'Не вдалося привʼязати пристрій';
    }
    return err instanceof Error ? err.message : 'Не вдалося привʼязати пристрій';
}

const ClaimGadget: FC<ClaimGadgetProps> = ({ gadgetId }) => {
    useAdminAuth();
    const self = useReactiveVar(me);
    const { checked, authenticated, authorised, tsutsykIds } = self;

    const { data, loading: statusLoading } = useGadgetStatus(gadgetId);
    const [claim, { loading: claiming }] = useClaimGadget();
    const [claimError, setClaimError] = useState<string | null>(null);
    const [claimed, setClaimed] = useState(false);

    const status = data?.getGadgetStatus;
    const alreadyMine = tsutsykIds.includes(gadgetId);

    async function handleClaim() {
        setClaimError(null);
        try {
            await claim({ variables: { id: gadgetId } });

            // Custom claims only land on the next token refresh — force one now
            // so tsutsykIds is up to date without asking the user to log in again.
            const idTokenResult = await auth.currentUser?.getIdTokenResult(true);
            const nextTsutsykIds = Array.isArray(idTokenResult?.claims.tsutsykIds)
                ? (idTokenResult.claims.tsutsykIds as string[])
                : self.tsutsykIds;

            me({ ...me(), tsutsykIds: nextTsutsykIds });
            setClaimed(true);
        } catch (err) {
            setClaimError(extractErrorMessage(err));
        }
    }

    function handleSignIn() {
        sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, `/claim/${gadgetId}`);
    }

    if (!checked || statusLoading) {
        return (
            <Center py={16}>
                <Spinner size="xl" colorPalette="blue" />
            </Center>
        );
    }

    if (!status) {
        return (
            <Alert.Root status="error" variant="subtle">
                <Alert.Content>
                    <Alert.Title>Пристрій не знайдено</Alert.Title>
                    <Alert.Description>
                        Код {gadgetId} не відповідає жодному підготовленому трекеру.
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        );
    }

    if (claimed || (status.claimed && alreadyMine)) {
        return (
            <Alert.Root status="success" variant="subtle">
                <Alert.Content>
                    <Alert.Title>Пристрій привʼязано</Alert.Title>
                    <Alert.Description>
                        <VStack align="start" gap={2}>
                            <Text>Цей трекер тепер привʼязаний до вашого акаунту.</Text>
                            <Button asChild size="sm" colorPalette="blue">
                                <Link href="/me">До трекеру</Link>
                            </Button>
                        </VStack>
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        );
    }

    if (status.claimed) {
        return (
            <Alert.Root status="warning" variant="subtle">
                <Alert.Content>
                    <Alert.Title>Пристрій вже привʼязано</Alert.Title>
                    <Alert.Description>
                        Цей трекер вже привʼязаний до іншого акаунту.
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        );
    }

    if (!authenticated) {
        return (
            <Card.Root>
                <Card.Header>
                    <Heading size="lg">Новий трекер знайдено</Heading>
                </Card.Header>
                <Card.Body>
                    <Text fontSize="sm" color="gray.500">
                        Увійдіть в акаунт власника, щоб привʼязати цей пристрій.
                    </Text>
                </Card.Body>
                <Card.Footer>
                    <Button asChild colorPalette="blue" onClick={handleSignIn}>
                        <Link href="/auth">Увійти</Link>
                    </Button>
                </Card.Footer>
            </Card.Root>
        );
    }

    if (!authorised) {
        return (
            <Alert.Root status="error" variant="subtle">
                <Alert.Content>
                    <Alert.Title>Немає доступу</Alert.Title>
                    <Alert.Description>
                        Привʼязати пристрій може лише акаунт власника.
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>
        );
    }

    return (
        <Card.Root>
            <Card.Header>
                <Heading size="lg">Новий трекер знайдено</Heading>
            </Card.Header>
            <Card.Body>
                <VStack align="start" gap={3}>
                    <Text fontSize="sm" color="gray.500">
                        Код пристрою: {gadgetId}
                    </Text>
                    {claimError && (
                        <Alert.Root status="error" variant="subtle">
                            <Alert.Content>
                                <Alert.Description>{claimError}</Alert.Description>
                            </Alert.Content>
                        </Alert.Root>
                    )}
                </VStack>
            </Card.Body>
            <Card.Footer>
                <Button colorPalette="blue" loading={claiming} onClick={handleClaim}>
                    Привʼязати пристрій
                </Button>
            </Card.Footer>
        </Card.Root>
    );
};

export default ClaimGadget;
