'use client';

import { FC } from "react";
import {
    AbsoluteCenter,
    Alert,
    Button,
    Container,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useReactiveVar } from "@apollo/client/react";
import { me } from "@/app/_lib/me";
import { useAdminAuth } from "@/app/_hooks/useAdminAuth";
import { useOrder } from "@/app/_lib/useOrders";
import AuthCard from "@/app/_components/auth";
import OrderDetails from "@/app/_components/order/details";

type OrderProps = {
    id: string;
};

/**
 * tsutsyk.live/orders/<number> — where a customer follows what they bought.
 *
 * Outside the (private) layout on purpose: that one gates on owning a Tsutsyk,
 * and somebody who has just pre-ordered one owns nothing yet.
 *
 * An order is only ever readable by the account that placed it, so somebody
 * arriving here signed out is asked to sign in first.
 */
const Order: FC<OrderProps> = ({ id }) => {
    useAdminAuth();
    const { checked, authenticated } = useReactiveVar(me);
    const { data, loading, refetch } = useOrder(id, { skip: !authenticated });

    if (!checked || (authenticated && loading)) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    if (!authenticated) {
        return (
            <Container maxW="2xl" py={{ base: 8, md: 16 }}>
                <Stack gap="6">
                    <Alert.Root status="info" rounded="xl">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Замовлення {id}</Alert.Title>
                            <Alert.Description>
                                Увійдіть тим самим акаунтом, яким оформляли замовлення, —
                                і ми покажемо його статус.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert.Root>

                    <AuthCard title="Вхід до замовлення" />
                </Stack>
            </Container>
        );
    }

    const order = data?.getOrder;

    // Either there is no such number, or it belongs to a different account —
    // the API does not say which, and neither should we.
    if (!order) {
        return (
            <Container maxW="2xl" py={{ base: 8, md: 16 }}>
                <Alert.Root status="warning" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Замовлення {id} не знайдено</Alert.Title>
                        <Alert.Description>
                            <Stack align="start" gap="3">
                                <Text>
                                    Перевірте номер — і чи це той акаунт, яким ви
                                    оформляли замовлення.
                                </Text>
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/orders">Мої замовлення</Link>
                                </Button>
                            </Stack>
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            </Container>
        );
    }

    return (
        <Container maxW="3xl" py={{ base: 8, md: 16 }}>
            <OrderDetails order={order} refetch={() => void refetch()} />
        </Container>
    );
};

export default Order;
