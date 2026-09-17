"use client";

import { FC, FormEvent } from "react";
import { Button, HStack, Stack, Text } from "@chakra-ui/react";
import { OrderFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import { DeliveryMethod } from "@/app/_documents/__generated__/globalTypes.codegen";
import { useUpdateOrderDelivery } from "@/app/_lib/useOrders";
import DeliveryFields from "@/app/_components/delivery-fields";

type DeliveryFormProps = {
    order: OrderFragmentFragment;
};

/**
 * Corrects where an order should go.
 *
 * The details were given at checkout — an order cannot be placed without them
 * — but weeks pass between a hand-built pre-order and its parcel, and people
 * move. The API keeps them editable until it ships.
 */
const DeliveryForm: FC<DeliveryFormProps> = ({ order }) => {
    const [mutate, { loading, called, error }] = useUpdateOrderDelivery();
    const disabled = !order.editable;

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const text = (field: string) => String(form.get(field) ?? "").trim();

        try {
            await mutate({
                variables: {
                    orderId: order.id,
                    input: {
                        // One method for now. The API also takes courier,
                        // Ukrposhta and pickup — add them here when the branch
                        // picker grows up. Written as a cast so the call does
                        // not depend on how codegen spells enum members.
                        method: "NOVA_POSHTA_BRANCH" as DeliveryMethod,
                        recipientName: text("recipientName"),
                        phone: text("phone"),
                        city: text("city"),
                        branch: text("branch"),
                        comment: text("comment") || null,
                    },
                },
            });
        } catch (saveError) {
            // Apollo hands the error back through the hook as well; this keeps
            // an unhandled rejection out of the console.
            console.error(
                "[order] could not save the delivery details",
                saveError,
            );
        }
    }

    return (
        <form onSubmit={onSubmit}>
            <Stack gap="4">
                <DeliveryFields
                    defaults={{
                        ...order.delivery,
                        phone: order.delivery?.phone ?? order.contactPhone,
                    }}
                    disabled={disabled}
                />

                {disabled ? (
                    <Text fontSize="sm" color="fg.muted">
                        Замовлення вже відправлене — напишіть нам, і ми щось
                        придумаємо.
                    </Text>
                ) : (
                    <HStack gap="3">
                        <Button
                            type="submit"
                            colorPalette="blue"
                            loading={loading}
                        >
                            Зберегти дані доставки
                        </Button>
                        {called && !loading && (
                            <Text
                                fontSize="sm"
                                color={error ? "red.fg" : "fg.muted"}
                            >
                                {error
                                    ? "Не вдалося зберегти. Спробуйте ще раз."
                                    : "Збережено"}
                            </Text>
                        )}
                    </HStack>
                )}
            </Stack>
        </form>
    );
};

export default DeliveryForm;
