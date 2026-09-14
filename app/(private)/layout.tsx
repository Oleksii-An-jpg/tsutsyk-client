'use client';
import { useEffect } from 'react';
import {useRouter} from "next/navigation";
import {Center, Container, Spinner} from "@chakra-ui/react";
import {authSettled, me} from "@/app/_lib/me";
import {useReactiveVar} from "@apollo/client/react";
import {useAdminAuth} from "@/app/_hooks/useAdminAuth";

export default function Layout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const self = useReactiveVar(me);
    const settled = authSettled(self);

    useAdminAuth();

    useEffect(() => {
        if (settled && !self.authorised) {
            router.replace('/auth');
            return;
        }
    }, [settled, router, self.authorised]);

    if (!settled) {
        return (
            <Container>
                <Center h="100vh">
                    <Spinner size="xl" colorPalette="blue" />
                </Center>
            </Container>
        );
    }

    return children;
}
