'use client';

import {FC, useEffect} from "react";
import {Button, HStack, Stack, Text} from "@chakra-ui/react";
import {useForm} from "react-hook-form";
import {OrderFragmentFragment} from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import {DeliveryMethod} from "@/app/_documents/__generated__/globalTypes.codegen";
import {useUpdateOrderDelivery} from "@/app/_lib/useOrders";
import {toLocalPhone} from "@/app/_lib/format";
import DeliveryFields, {DeliveryValues} from "@/app/_components/delivery-fields";

type DeliveryFormProps = {
    order: OrderFragmentFragment;
};

function valuesFrom(order: OrderFragmentFragment): DeliveryValues {
    return {
        recipientName: order.delivery?.recipientName ?? '',
        phone: toLocalPhone(order.delivery?.phone ?? order.contactPhone),
        city: order.delivery?.city ?? '',
        branch: order.delivery?.branch ?? '',
        comment: order.delivery?.comment ?? '',
    };
}

/**
 * Corrects where an order should go.
 *
 * The details were given at checkout — an order cannot be placed without them
 * — but weeks pass between a hand-built pre-order and its parcel, and people
 * move. The API keeps them editable until it ships.
 */
const DeliveryForm: FC<DeliveryFormProps> = ({order}) => {
    const [mutate, {loading, called, error}] = useUpdateOrderDelivery();
    const disabled = !order.editable;

    const {register, handleSubmit, reset, control, formState: {errors}} = useForm<DeliveryValues>({
        mode: 'onTouched',
        defaultValues: valuesFrom(order),
    });

    // The order arrives after the first render, and again whenever something
    // else changes it — a saved edit, a webhook landing on the page.
    useEffect(() => {
        reset(valuesFrom(order));
    }, [order, reset]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            await mutate({
                variables: {
                    orderId: order.id,
                    input: {
                        // One method for now. The API also takes courier,
                        // Ukrposhta and pickup — add them here when the branch
                        // picker grows up. Written as a cast so the call does
                        // not depend on how codegen spells enum members.
                        method: 'NOVA_POSHTA_BRANCH' as DeliveryMethod,
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
            console.error('[order] could not save the delivery details', saveError);
        }
    });

    return (
        <Stack as="form" gap={4} onSubmit={onSubmit}>
            <DeliveryFields
                register={register}
                errors={errors}
                control={control}
                disabled={disabled}
            />

            {disabled ? (
                <Text fontSize="sm" color="fg.muted">
                    Замовлення вже відправлене — напишіть нам, і ми щось придумаємо.
                </Text>
            ) : (
                <HStack gap={3}>
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
