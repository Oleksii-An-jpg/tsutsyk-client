'use client';

import { FC } from "react";
import {
    Badge,
    Box,
    Button,
    Card,
    Container,
    HStack,
    Heading,
    Icon,
    Separator,
    Text,
    VStack,
} from "@chakra-ui/react";
import { LuCircleAlert, LuCircleCheck, LuClock, LuHouse } from "react-icons/lu";
import Link from "next/link";

import type { InvoiceStatus } from "@/app/_lib/monobank";

type Presentation = {
    title: string;
    body: string;
    colorPalette: string;
    icon: typeof LuCircleCheck;
    badge: string;
};

const PRESENTATION: Record<InvoiceStatus, Presentation> = {
    success: {
        title: "Дякую! Оплату отримано",
        body: "Передзамовлення прийнято. Я напишу вам, щойно ваш Цуцик піде в зборку.",
        colorPalette: "green",
        icon: LuCircleCheck,
        badge: "Оплачено",
    },
    hold: {
        title: "Кошти заблоковано",
        body: "Банк утримав суму й ось-ось підтвердить платіж. Оновіть сторінку за хвилину.",
        colorPalette: "yellow",
        icon: LuClock,
        badge: "Утримано",
    },
    processing: {
        title: "Платіж обробляється",
        body: "Банк ще підтверджує оплату. Це зазвичай кілька секунд — оновіть сторінку.",
        colorPalette: "yellow",
        icon: LuClock,
        badge: "В обробці",
    },
    created: {
        title: "Платіж ще не завершено",
        body: "Рахунок створено, але оплата не пройшла. Якщо ви передумали — просто закрийте сторінку.",
        colorPalette: "yellow",
        icon: LuClock,
        badge: "Очікує оплати",
    },
    failure: {
        title: "Платіж не пройшов",
        body: "Кошти не списано. Спробуйте ще раз або напишіть мені — розберемось разом.",
        colorPalette: "red",
        icon: LuCircleAlert,
        badge: "Помилка",
    },
    expired: {
        title: "Час на оплату вийшов",
        body: "Рахунок більше не активний. Кошти не списано — можете створити нове замовлення.",
        colorPalette: "gray",
        icon: LuCircleAlert,
        badge: "Протерміновано",
    },
    reversed: {
        title: "Кошти повернено",
        body: "Платіж скасовано, гроші повертаються на вашу картку.",
        colorPalette: "gray",
        icon: LuCircleAlert,
        badge: "Повернено",
    },
};

export type OrderStatusProps = {
    reference: string;
    status: InvoiceStatus;
    productName: string;
    quantity: number;
    /** Already formatted server-side — prices never cross to the client raw. */
    total: string;
    failureReason?: string;
};

const OrderStatus: FC<OrderStatusProps> = ({
    reference,
    status,
    productName,
    quantity,
    total,
    failureReason,
}) => {
    const view = PRESENTATION[status];

    return (
        <Box py={{ base: 16, md: 24 }}>
            <Container maxW="lg">
                <Card.Root colorPalette={view.colorPalette} p={{ base: 5, md: 7 }}>
                    <VStack align="start" gap="5">
                        <HStack gap="3">
                            <Icon as={view.icon} boxSize="6" color="colorPalette.fg" />
                            <Badge colorPalette={view.colorPalette} variant="subtle" rounded="full">
                                {view.badge}
                            </Badge>
                        </HStack>

                        <VStack align="start" gap="2">
                            <Heading as="h1" size="xl">
                                {view.title}
                            </Heading>
                            <Text color="fg.muted">{view.body}</Text>
                            {failureReason && (
                                <Text fontSize="sm" color="fg.muted">
                                    Причина: {failureReason}
                                </Text>
                            )}
                        </VStack>

                        <Separator w="full" />

                        <VStack align="start" gap="1" w="full" fontSize="sm">
                            <HStack justify="space-between" w="full">
                                <Text color="fg.muted">Замовлення</Text>
                                <Text fontWeight="medium">
                                    {productName} × {quantity}
                                </Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                                <Text color="fg.muted">Сума</Text>
                                <Text fontWeight="medium">{total}</Text>
                            </HStack>
                            <HStack justify="space-between" w="full">
                                <Text color="fg.muted">Номер</Text>
                                <Text fontFamily="mono" fontSize="xs" color="fg.muted">
                                    {reference}
                                </Text>
                            </HStack>
                        </VStack>

                        <Button asChild variant="outline" rounded="full" size="sm">
                            <Link href="/">
                                <LuHouse />
                                На головну
                            </Link>
                        </Button>
                    </VStack>
                </Card.Root>
            </Container>
        </Box>
    );
};

export default OrderStatus;
