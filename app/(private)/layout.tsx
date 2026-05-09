'use client';
import { useEffect } from 'react';
import {useRouter} from "next/navigation";
import {Center, Container, Spinner} from "@chakra-ui/react";
import {me} from "@/app/_lib/me";
import {useReactiveVar} from "@apollo/client/react";
import {useAdminAuth} from "@/app/_hooks/useAdminAuth";

export default function Layout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const {authorised, checked} = useReactiveVar(me);

    useAdminAuth();

    useEffect(() => {
        if (checked && !authorised) {
            router.push('/auth');
            return;
        }
    }, [checked, router, authorised]);

    if (!checked) {
        return (
            <Container py={4}>
                <Center h="100vh">
                    <Spinner size="xl" colorPalette="blue" />
                </Center>
            </Container>
        );
    }

    return children;
}