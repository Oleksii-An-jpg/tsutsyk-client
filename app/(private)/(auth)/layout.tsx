'use client'

import {Alert, Text, Link as ChakraLink, VStack, Button} from "@chakra-ui/react";
import Link from "next/link";
import {auth} from "@/app/_lib/firebase";
import {useReactiveVar} from "@apollo/client/react";
import {me} from "@/app/_lib/me";

export default function Layout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {
    const {checked, authorised, authenticated} = useReactiveVar(me);

    if (checked && authenticated && !authorised) {
        return (
            <VStack>
                <Alert.Root status="warning">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Доступ заборонено</Alert.Title>
                        <Alert.Description>
                            Вам потрібні права адміністратора для доступу до редагування. Для отримання таких прав, зв&#39;яжіться з <ChakraLink variant="underline" asChild><Link href="mailto:voodoo.spr@gmail.com"><Text as="b">voodoo.spr@gmail.com</Text></Link></ChakraLink>
                        </Alert.Description>
                    </Alert.Content>
                    <Button
                        size="sm"
                        onClick={() => auth.signOut()}
                        colorPalette="orange"
                        variant="subtle"
                    >
                        Вийти
                    </Button>
                </Alert.Root>
            </VStack>
        );
    }

    return children;
}
