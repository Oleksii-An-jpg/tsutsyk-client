'use client';

import { FC } from "react";
import {
    AbsoluteCenter,
    Alert,
    Container,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useReactiveVar } from "@apollo/client/react";
import { me } from "@/app/_lib/me";
import { useAdminAuth } from "@/app/_hooks/useAdminAuth";
import { useOrder } from "@/app/_lib/useOrders";
import AuthCard from "@/app/_components/auth";
import ClaimOrder from "@/app/_components/order/claim";
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
 * An order is only readable by the account it belongs to, so this is: sign in,
 * claim it if it was bought as a guest, then the order itself.
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
                                Увійдіть — тим самим номером телефону чи поштою, що й при
                                оформленні, — і ми покажемо статус замовлення.
                            </Alert.Description>
                        </Alert.Content>
                    </Alert.Root>

                    <AuthCard title="Вхід до замовлення" />
                </Stack>
            </Container>
        );
    }

    const order = data?.getOrder;

    // No order in the answer means one of two things, and neither is an error
    // worth a red box: it is somebody else's (or nobody's yet), or there is no
    // such number. The claim step covers the first and explains the second.
    if (!order) {
        return (
            <Container maxW="2xl" py={{ base: 8, md: 16 }}>
                <Stack gap="4">
                    <ClaimOrder id={id} onClaimed={() => void refetch()} />
                    <Text fontSize="sm" color="fg.muted">
                        Якщо такого замовлення не існує — перевірте номер у листі від
                        monobank або в адресному рядку після оплати.
                    </Text>
                </Stack>
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
