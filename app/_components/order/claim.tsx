'use client';

import { FC } from "react";
import {
    Button,
    Card,
    Field,
    Heading,
    Input,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useClaimOrder } from "@/app/_lib/useOrders";

type ClaimOrderProps = {
    id: string;
    onClaimed: () => void;
};

type Values = { phone: string };

/**
 * Attaches an order bought without an account to the one the customer just
 * signed in with.
 *
 * Deliberately a button rather than something that happens on sign-in: the
 * order number came in from a URL, and quietly binding it to whichever account
 * happens to be signed in is not a decision to make on somebody's behalf.
 */
const ClaimOrder: FC<ClaimOrderProps> = ({ id, onClaimed }) => {
    const [claim, { loading, error }] = useClaimOrder();
    const { register, handleSubmit } = useForm<Values>({ defaultValues: { phone: "" } });

    const onSubmit = handleSubmit(async ({ phone }) => {
        try {
            await claim({ variables: { orderId: id, phone: phone || null } });
            onClaimed();
        } catch (claimError) {
            // Surfaced through the hook below; logged so the real reason (which
            // is written for us, not for the customer) is not lost.
            console.error("[order] could not claim the order", claimError);
        }
    });

    return (
        <Card.Root>
            <Card.Header>
                <Heading size="md">Це ваше замовлення?</Heading>
                <Text fontSize="sm" color="fg.muted">
                    Замовлення {id} ще не прив’язане до акаунта. Прив’яжіть його, щоб
                    стежити за статусом і вказати дані доставки.
                </Text>
            </Card.Header>

            <Card.Body>
                <Stack as="form" gap="4" onSubmit={onSubmit}>
                    <Field.Root>
                        <Field.Label>Телефон із замовлення</Field.Label>
                        <Input
                            type="tel"
                            placeholder="+380…"
                            {...register("phone")}
                        />
                        <Field.HelperText>
                            Потрібен, лише якщо ви лишали номер під час оформлення.
                        </Field.HelperText>
                    </Field.Root>

                    {error && (
                        <Text fontSize="sm" color="red.fg" role="alert">
                            Не вдалося прив’язати замовлення. Перевірте номер телефону —
                            або напишіть нам, і ми розберемося.
                        </Text>
                    )}

                    <Button
                        type="submit"
                        alignSelf="start"
                        colorPalette="blue"
                        loading={loading}
                    >
                        Прив’язати замовлення
                    </Button>
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

export default ClaimOrder;
