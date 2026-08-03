'use client';

import {useEffect} from 'react';
import {
    Button,
    Tabs,
    Heading,
    Card, Container, VStack, Group,
    Link as ChakraLink,
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
import {useAdminAuth} from "@/app/_hooks/useAdminAuth";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {POST_AUTH_REDIRECT_KEY} from "@/app/_lib/postAuthRedirect";

export default function Auth() {
    const { value, toggle } = useBoolean(false);
    const { user } = useAdminAuth();
    const router = useRouter();

    // Sends the user back to wherever they came from (e.g. a /claim/{gadgetId}
    // link scanned from a device QR code) instead of always landing on /me.
    useEffect(() => {
        if (!user) return;
        const redirectTo = sessionStorage.getItem(POST_AUTH_REDIRECT_KEY);
        if (!redirectTo) return;
        sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
        router.replace(redirectTo);
    }, [user, router]);

    async function handleGoogleLogin() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error("Google login error:", err);
        }
    }

    return (
        <Container maxW="2xl">
            {user ? <VStack>
                <Heading>{user.displayName}</Heading>
                <Group>
                    <Button asChild>
                        <ChakraLink asChild>
                            <Link href="/me">
                                До трекеру
                            </Link>
                        </ChakraLink>
                    </Button>
                    <Button
                        onClick={() => auth.signOut()}
                        colorPalette="red"
                        variant="outline"
                    >
                        Вийти
                    </Button>
                </Group>
            </VStack> : <Card.Root>
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
            </Card.Root>}
        </Container>
    );
}