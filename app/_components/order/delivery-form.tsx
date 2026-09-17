'use client';

import { FC, useEffect } from "react";
import { Button, Field, HStack, Input, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { OrderFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import { DeliveryMethod } from "@/app/_documents/__generated__/globalTypes.codegen";
import { useUpdateOrderDelivery } from "@/app/_lib/useOrders";

type DeliveryFormProps = {
    order: OrderFragmentFragment;
};

type Values = {
    recipientName: string;
    phone: string;
    city: string;
    branch: string;
    comment: string;
};

/**
 * Where the tracker should go.
 *
 * Asked for after payment on purpose: these are pre-orders, assembled by hand
 * over weeks, and a customer who has to fill in an address before they can pay
 * is a customer who leaves. The API keeps it editable until the order ships.
 */
const DeliveryForm: FC<DeliveryFormProps> = ({ order }) => {
    const [mutate, { loading, called, error }] = useUpdateOrderDelivery();

    const { register, handleSubmit, reset, formState } = useForm<Values>({
        defaultValues: {
            recipientName: order.delivery?.recipientName ?? "",
            phone: order.delivery?.phone ?? order.contactPhone ?? "",
            city: order.delivery?.city ?? "",
            branch: order.delivery?.branch ?? "",
            comment: order.delivery?.comment ?? "",
        },
    });

    useEffect(() => {
        reset({
            recipientName: order.delivery?.recipientName ?? "",
            phone: order.delivery?.phone ?? order.contactPhone ?? "",
            city: order.delivery?.city ?? "",
            branch: order.delivery?.branch ?? "",
            comment: order.delivery?.comment ?? "",
        });
    }, [order, reset]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            await mutate({
                variables: {
                    orderId: order.id,
                    input: {
                        // One method for now. The API also takes courier,
                        // Ukrposhta and pickup — add them here when the branch
                        // picker below grows up. Written as a cast so the call
                        // does not depend on how codegen spells enum members.
                        method: "NOVA_POSHTA_BRANCH" as DeliveryMethod,
                        recipientName: values.recipientName,
                        phone: values.phone,
                        city: values.city,
                        branch: values.branch,
                        comment: values.comment || null,
                    },
                },
            });
        } catch (saveError) {
            // Apollo hands the error back through the hook as well; this keeps
            // an unhandled rejection out of the console.
            console.error("[order] could not save the delivery details", saveError);
        }
    });

    const disabled = !order.editable;

    return (
        <Stack as="form" gap="4" onSubmit={onSubmit}>
            <SimpleGrid columns={{ base: 1, sm: 2 }} gap="4">
                <Field.Root required invalid={!!formState.errors.recipientName}>
                    <Field.Label>
                        Отримувач <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        placeholder="Прізвище та ім’я"
                        disabled={disabled}
                        {...register("recipientName", { required: true })}
                    />
                </Field.Root>

                <Field.Root required invalid={!!formState.errors.phone}>
                    <Field.Label>
                        Телефон <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        type="tel"
                        placeholder="+380…"
                        disabled={disabled}
                        {...register("phone", { required: true, minLength: 9 })}
                    />
                </Field.Root>

                <Field.Root required invalid={!!formState.errors.city}>
                    <Field.Label>
                        Місто <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        placeholder="Львів"
                        disabled={disabled}
                        {...register("city", { required: true })}
                    />
                </Field.Root>

                {/* TODO(delivery): a plain text box until the Nova Poshta branch
                    picker lands. The API only checks that a branch is filled
                    in, so swapping this input for the picker is a change here
                    and nowhere else. */}
                <Field.Root required invalid={!!formState.errors.branch}>
                    <Field.Label>
                        Відділення <Field.RequiredIndicator />
                    </Field.Label>
                    <Input
                        placeholder="Відділення №12, вул. Зелена 1"
                        disabled={disabled}
                        {...register("branch", { required: true })}
                    />
                    <Field.HelperText>
                        Поки що вручну — невдовзі тут буде вибір відділення зі списку.
                    </Field.HelperText>
                </Field.Root>
            </SimpleGrid>

            <Field.Root>
                <Field.Label>Коментар</Field.Label>
                <Input
                    placeholder="Що нам варто знати про доставку"
                    disabled={disabled}
                    {...register("comment")}
                />
            </Field.Root>

            {disabled ? (
                <Text fontSize="sm" color="fg.muted">
                    Замовлення вже відправлене — напишіть нам, і ми щось придумаємо.
                </Text>
            ) : (
                <HStack gap="3">
                    <Button type="submit" colorPalette="blue" loading={loading}>
                        Зберегти дані доставки
                    </Button>
                    {called && !loading && (
                        <Text fontSize="sm" color={error ? "red.fg" : "fg.muted"}>
                            {error
                                ? "Не вдалося зберегти. Спробуйте ще раз."
                                : "Збережено"}
                        </Text>
                    )}
                </HStack>
            )}
        </Stack>
    );
};

export default DeliveryForm;
