'use client';

import { FC } from "react";
import { useSearchParams } from "next/navigation";
import { Alert, Code, Text } from "@chakra-ui/react";

/**
 * The receipt line after monobank hands the buyer back.
 *
 * monobank returns everyone to the same address whether they paid or not, so
 * this says nothing about the payment — it shows the order number, which is
 * the one thing the buyer needs and would otherwise never see. With it they
 * can follow the order, and claim it against their account once they sign in.
 *
 * The payment itself is confirmed by the webhook, not by anybody arriving at
 * this URL.
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
                    <Text>
                        Збережіть його — за ним можна стежити за замовленням. Увійдіть
                        тим самим номером телефону, і замовлення з’явиться у вашому
                        кабінеті.
                    </Text>
                </Alert.Description>
            </Alert.Content>
        </Alert.Root>
    );
};

export default OrderNotice;
