'use client';

import { FC } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Alert, Button, Code, Stack } from "@chakra-ui/react";

/**
 * The receipt line after monobank hands the buyer back.
 *
 * Checkout now returns buyers to /orders, so this only catches the ones that
 * come back to the root — an invoice opened before that change, or a shared
 * link. It says nothing about the payment: monobank returns everyone here
 * whether they paid or not, and only the webhook the API receives settles
 * that. Its job is to carry the buyer on to the order itself.
 */
const OrderNotice: FC = () => {
    const orderId = useSearchParams().get("order");

    if (!orderId) return null;

    return (
        <Alert.Root status="info" rounded="xl" mb="8">
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>
                    Дякуємо! Номер замовлення: <Code>{orderId}</Code>
                </Alert.Title>
                <Alert.Description>
                    <Stack align="start" gap="3">
                        Збережіть його — за ним можна стежити за замовленням.
                        <Button asChild size="sm" colorPalette="blue">
                            <Link href={`/orders/${orderId}`}>Статус замовлення</Link>
                        </Button>
                    </Stack>
                </Alert.Description>
            </Alert.Content>
        </Alert.Root>
    );
};

export default OrderNotice;
