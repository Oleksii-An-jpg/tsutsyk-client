'use client';

import {useEffect} from 'react';
import {useRouter} from 'next/navigation';
import {
    Button,
    Tabs,
    Heading,
    Card, Center, Container, Spinner,
    Text, HStack
} from '@chakra-ui/react';
import {
    GoogleAuthProvider,
    signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/app/_lib/firebase';
import {useBoolean} from "usehooks-ts";
import {BiLogoGoogle} from "react-icons/bi";
import EmailAuth from "@/app/(private)/(auth)/auth/_ui/email";
import PhoneAuth from "@/app/(private)/(auth)/auth/_ui/phone";
import {me} from "@/app/_lib/me";
import {useReactiveVar} from "@apollo/client/react";

export default function Auth() {
    const { value, toggle } = useBoolean(false);
    const router = useRouter();
    const { checked, authorised } = useReactiveVar(me);

    // Signing in is a means, not a destination. Once the session is good for
    // the tracker there is nothing left to decide here, so go straight to it —
    // `replace` rather than `push` so Back doesn't bounce the user into a
    // login screen they have already passed.
    useEffect(() => {
        if (checked && authorised) {
            router.replace('/me');
        }
    }, [checked, authorised, router]);

    async function handleGoogleLogin() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Google login error:", err);
        }
    }

    if (checked && authorised) {
        return (
            <Center h="50vh">
                <Spinner size="xl" colorPalette="blue" />
            </Center>
        );
    }

    return (
        <Container maxW="2xl">
            <Card.Root>
                <Card.Header>
                    <Heading size="lg">
                        Авторизація
                    </Heading>
                </Card.Header>

                <Card.Body>
                    <Tabs.Root defaultValue="email" fitted>
                        <Tabs.List>
                            <Tabs.Trigger value="email">Пошта</Tabs.Trigger>
                            <Tabs.Trigger value="phone">Телефон</Tabs.Trigger>
                        </Tabs.List>

                        <Tabs.Content value="email" pt={4}>
                            <EmailAuth isSignUp={value} />
                        </Tabs.Content>

                        <Tabs.Content value="phone" pt={4}>
                            <PhoneAuth />
                        </Tabs.Content>
                    </Tabs.Root>
                </Card.Body>

                <Card.Footer>
                    <HStack w="full" wrap="wrap" justify="space-between">
                        <Button
                            variant="outline"
                            onClick={handleGoogleLogin}
                        >
                            <BiLogoGoogle />
                            Зайти через Ґуґл
                        </Button>
                        <HStack>
                            <Text fontSize="sm">
                                {value
                                    ? 'Вже маєте обліковий запис?'
                                    : "Немає облікового запису?"}
                            </Text>
                            <Button
                                size="xs"
                                variant="outline"
                                onClick={() => {
                                    toggle();
                                }}
                            >
                                {value
                                    ? 'Увійти'
                                    : "Зареєструватися"}
                            </Button>
                        </HStack>
                    </HStack>
                </Card.Footer>
            </Card.Root>
        </Container>
    );
}
