'use client';

import {FC} from 'react';
import {Button, Card, Heading, HStack, Tabs, Text} from '@chakra-ui/react';
import {GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import {useBoolean} from 'usehooks-ts';
import {BiLogoGoogle} from 'react-icons/bi';
import {auth} from '@/app/_lib/firebase';
import EmailAuth from '@/app/_components/auth/email';
import PhoneAuth from '@/app/_components/auth/phone';
import Link from "next/link";

type AuthCardProps = {
    title: string;
    description?: string;
};

// Shared by /auth and by the QR claim flow at /tsutsyk/<id>. Those two kept
// their own copies of this card for a while — the claim flow needed one that
// didn't sit under a layout gating on authorisation a first-time claimant
// can't have yet — and the copies had started to drift apart.
const AuthCard: FC<AuthCardProps> = ({title, description}) => {
    const {value: isSignUp, toggle} = useBoolean(false);

    async function handleGoogleLogin() {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error('Google login error:', err);
        }
    }

    return (
        <Card.Root>
            <Card.Header>
                <HStack justify="space-between">
                    <Heading size="lg">{title}</Heading>
                    <Button asChild size="sm" variant="subtle">
                        <Link href="/">На головну</Link>
                    </Button>
                </HStack>
                {description && (
                    <Text fontSize="sm" color="fg.muted">
                        {description}
                    </Text>
                )}
            </Card.Header>

            <Card.Body>
                <Tabs.Root defaultValue="email" fitted>
                    <Tabs.List>
                        <Tabs.Trigger value="email">Пошта</Tabs.Trigger>
                        <Tabs.Trigger value="phone">Телефон</Tabs.Trigger>
                    </Tabs.List>

                    <Tabs.Content value="email" pt={4}>
                        <EmailAuth isSignUp={isSignUp} />
                    </Tabs.Content>

                    <Tabs.Content value="phone" pt={4}>
                        <PhoneAuth />
                    </Tabs.Content>
                </Tabs.Root>
            </Card.Body>

            <Card.Footer>
                <HStack w="full" wrap="wrap" justify="space-between">
                    <Button variant="outline" onClick={handleGoogleLogin}>
                        <BiLogoGoogle />
                        Зайти через Ґуґл
                    </Button>
                    <HStack>
                        <Text fontSize="sm">
                            {isSignUp ? 'Вже маєте обліковий запис?' : 'Немає облікового запису?'}
                        </Text>
                        <Button size="xs" variant="outline" onClick={() => toggle()}>
                            {isSignUp ? 'Увійти' : 'Зареєструватися'}
                        </Button>
                    </HStack>
                </HStack>
            </Card.Footer>
        </Card.Root>
    );
};

export default AuthCard;
