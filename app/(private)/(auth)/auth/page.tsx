'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {Center, Container, Spinner} from '@chakra-ui/react';
import {useReactiveVar} from '@apollo/client/react';
import {me} from '@/app/_lib/me';
import AuthCard from '@/app/_components/auth';

export default function Auth() {
    const router = useRouter();
    const {checked, authorised} = useReactiveVar(me);

    // Signing in is a means, not a destination. Once the session is good for
    // the tracker there is nothing left to decide here, so go straight to it —
    // `replace` rather than `push` so Back doesn't bounce the user into a
    // login screen they have already passed.
    useEffect(() => {
        if (checked && authorised) {
            router.replace('/me');
        }
    }, [checked, authorised, router]);

    if (checked && authorised) {
        return (
            <Center h="50vh">
                <Spinner size="xl" colorPalette="blue" />
            </Center>
        );
    }

    return (
        <Container maxW="2xl">
            <AuthCard title="Авторизація" />
        </Container>
    );
}
