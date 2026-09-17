'use client';

import { FC, useEffect } from "react";
import {
    AbsoluteCenter,
    Button,
    Card,
    Container,
    Heading,
    HStack,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useReactiveVar } from "@apollo/client/react";
import { LuArrowRight } from "react-icons/lu";
import { me } from "@/app/_lib/me";
import { useAdminAuth } from "@/app/_hooks/useAdminAuth";
import { useMyOrders } from "@/app/_lib/useOrders";
import { formatDateTime, formatPrice } from "@/app/_lib/format";
import AuthCard from "@/app/_components/auth";
import OrderStatusBadge from "@/app/_components/order/status";

/**
 * tsutsyk.live/orders — everything this customer has bought.
 *
 * Also where monobank returns a buyer: it appends `?order=<number>` to the
 * address we gave it, and that number goes straight to its own page.
 */
const Orders: FC = () => {
    useAdminAuth();
    const { checked, authenticated } = useReactiveVar(me);
    const router = useRouter();
    const justOrdered = useSearchParams().get("order");
    const { data, loading } = useMyOrders({ skip: !authenticated || !!justOrdered });

    useEffect(() => {
        if (justOrdered) router.replace(`/orders/${justOrdered}`);
    }, [justOrdered, router]);

    if (!checked || justOrdered || (authenticated && loading)) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    if (!authenticated) {
        return (
            <Container maxW="2xl" py={{ base: 8, md: 16 }}>
                <AuthCard
                    title="Мої замовлення"
                    description="Увійдіть, щоб побачити свої замовлення"
                />
            </Container>
        );
    }

    const orders = data?.getMyOrders ?? [];

    return (
        <Container maxW="3xl" py={{ base: 8, md: 16 }}>
            <Stack gap="6">
                <Heading size="xl">Мої замовлення</Heading>

                {orders.length === 0 ? (
                    <Card.Root>
                        <Card.Body>
                            <Stack gap="4" align="start">
                                <Text color="fg.muted">
                                    Тут поки порожньо. Якщо ви замовляли без акаунта —
                                    відкрийте посилання з номером замовлення, і його можна
                                    буде прив’язати сюди.
                                </Text>
                                <Button asChild variant="outline">
                                    <Link href="/">На головну</Link>
                                </Button>
                            </Stack>
                        </Card.Body>
                    </Card.Root>
                ) : (
                    orders.map((order) => (
                        <Card.Root key={order.id}>
                            <Card.Body>
                                <HStack justify="space-between" wrap="wrap" gap="4">
                                    <Stack gap="1">
                                        <HStack gap="3">
                                            <Text fontWeight="semibold">{order.id}</Text>
                                            <OrderStatusBadge status={order.status} size="sm" />
                                        </HStack>
                                        <Text fontSize="sm" color="fg.muted">
                                            {formatDateTime(order.createdAt)} ·{" "}
                                            {formatPrice(order.amount)}
                                        </Text>
                                    </Stack>

                                    <Button asChild size="sm" variant="outline" rounded="full">
                                        <Link href={`/orders/${order.id}`}>
                                            Деталі
                                            <LuArrowRight />
                                        </Link>
                                    </Button>
                                </HStack>
                            </Card.Body>
                        </Card.Root>
                    ))
                )}
            </Stack>
        </Container>
    );
};

export default Orders;
