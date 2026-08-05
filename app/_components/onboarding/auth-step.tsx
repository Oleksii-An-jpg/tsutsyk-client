'use client';

import {Button, Card, Heading, HStack, Tabs, Text} from '@chakra-ui/react';
import {GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import {useBoolean} from 'usehooks-ts';
import {BiLogoGoogle} from 'react-icons/bi';
import {auth} from '@/app/_lib/firebase';
import EmailAuth from '@/app/(private)/(auth)/auth/_ui/email';
import PhoneAuth from '@/app/(private)/(auth)/auth/_ui/phone';

// Deliberately self-contained rather than reusing the /auth route: that
// route lives under a layout that gates on *global* authorisation (an
// admin-granted role), which a first-time claimant doesn't have yet.
const AuthStep = () => {
    const {value, toggle} = useBoolean(false);

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
                <Heading size="lg">Знайомство з цуциком</Heading>
                <Text fontSize="sm" color="gray.500">
                    Спочатку увійдіть або зареєструйтесь
                </Text>
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
                    <Button variant="outline" onClick={handleGoogleLogin}>
                        <BiLogoGoogle />
                        Зайти через Ґуґл
                    </Button>
                    <HStack>
                        <Text fontSize="sm">
                            {value ? 'Вже маєте обліковий запис?' : 'Немає облікового запису?'}
                        </Text>
                        <Button size="xs" variant="outline" onClick={() => toggle()}>
                            {value ? 'Увійти' : 'Зареєструватися'}
                        </Button>
                    </HStack>
                </HStack>
            </Card.Footer>
        </Card.Root>
    );
};

export default AuthStep;
