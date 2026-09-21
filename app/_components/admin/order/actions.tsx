'use client';

import { FC, useEffect } from "react";
import {
    Alert,
    Button,
    Card,
    Field,
    Heading,
    HStack,
    Input,
    Separator,
    Stack,
    Text,
} from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useBoolean } from "usehooks-ts";
import { LuBox, LuCheck, LuTruck, LuX } from "react-icons/lu";
import { OrderFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import {
    useCancelAnyOrder,
    useMarkOrderDelivered,
    useMarkOrderInAssembly,
    useMarkOrderShipped,
} from "@/app/_lib/useAdminOrders";

type OrderActionsProps = {
    order: OrderFragmentFragment;
    /** Re-reads the order, for the things the mutation answer cannot settle. */
    refetch: () => void;
};

/**
 * Statuses a parcel can be dispatched from, mirroring the API.
 *
 * `SHIPPED` is in the list because re-sending is how a mistyped waybill is
 * corrected — a typo is noticed after the fact or not at all.
 */
const SHIPPABLE = new Set(["PAID", "IN_ASSEMBLY", "SHIPPED"]);

/** Nova Poshta waybills are fourteen digits; the API refuses anything else. */
const NOVA_POSHTA = new Set(["NOVA_POSHTA_BRANCH", "NOVA_POSHTA_COURIER"]);

type WaybillValues = { trackingNumber: string };
type CancelValues = { reason: string };

/**
 * The buttons that move an order along — the only way one reaches SHIPPED or
 * DELIVERED, and the only way we can call one off on a customer's behalf.
 *
 * Every one of these is refused by the API unless the order is in a state it
 * can legally leave, so this offers only what will be accepted rather than
 * showing four buttons and letting three of them fail. The API is still the
 * one deciding: two people packing the same order will race, and the loser
 * gets a conflict, which is shown rather than swallowed.
 */
const OrderActions: FC<OrderActionsProps> = ({ order, refetch }) => {
    const [assemble, { loading: assembling, error: assembleError }] =
        useMarkOrderInAssembly();
    const [deliver, { loading: delivering, error: deliverError }] =
        useMarkOrderDelivered();

    const canAssemble = order.status === "PAID";
    const canShip = SHIPPABLE.has(order.status);
    const canDeliver = order.status === "SHIPPED";

    const nothingToDo = !canAssemble && !canShip && !canDeliver && !order.cancellable;

    return (
        <Card.Root>
            <Card.Header>
                <Heading size="md">Що робимо</Heading>
            </Card.Header>
            <Card.Body>
                <Stack gap="5">
                    {nothingToDo && (
                        <Text color="fg.muted">
                            Це замовлення закрите — робити з ним уже нічого не треба.
                        </Text>
                    )}

                    {(canAssemble || canDeliver) && (
                        <HStack wrap="wrap" gap="3">
                            {canAssemble && (
                                <Button
                                    colorPalette="blue"
                                    loading={assembling}
                                    onClick={() =>
                                        void assemble({
                                            variables: { orderId: order.id },
                                        }).catch(swallow)
                                    }
                                >
                                    <LuBox />
                                    Почати збирати
                                </Button>
                            )}

                            {canDeliver && (
                                <Button
                                    colorPalette="green"
                                    loading={delivering}
                                    onClick={() =>
                                        void deliver({
                                            variables: { orderId: order.id },
                                        }).catch(swallow)
                                    }
                                >
                                    <LuCheck />
                                    Покупець отримав
                                </Button>
                            )}
                        </HStack>
                    )}

                    <Problem error={assembleError ?? deliverError} />

                    {canAssemble && (
                        <Text fontSize="xs" color="fg.muted">
                            Щойно почнемо збирати, покупець уже не зможе змінити адресу
                            — тож накладну можна виписувати спокійно.
                        </Text>
                    )}

                    {canShip && (
                        <>
                            {(canAssemble || canDeliver) && <Separator />}
                            <Waybill order={order} />
                        </>
                    )}

                    {order.cancellable && (
                        <>
                            <Separator />
                            <CallOff order={order} refetch={refetch} />
                        </>
                    )}
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

/**
 * Records the waybill, which is also what sends the order on its way.
 *
 * The number is created by hand in Nova Poshta's own cabinet — nothing here
 * talks to the carrier — so this is somebody copying a number off a printed
 * sheet, and the field is shaped for that: spaces and dashes are allowed in
 * and stripped, because that is how a number arrives when it is pasted.
 */
const Waybill: FC<{ order: OrderFragmentFragment }> = ({ order }) => {
    const [ship, { loading, error }] = useMarkOrderShipped();
    const already = order.status === "SHIPPED";
    const novaPoshta = NOVA_POSHTA.has(order.delivery?.method ?? "");

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<WaybillValues>({
        mode: "onTouched",
        defaultValues: { trackingNumber: order.trackingNumber ?? "" },
    });

    // The order arrives after the first render, and again whenever something
    // else changes it — our own save, or somebody at the next desk correcting
    // the number while this page is open. Without this the field would keep
    // showing what it was opened with.
    useEffect(() => {
        reset({ trackingNumber: order.trackingNumber ?? "" });
    }, [order.trackingNumber, reset]);

    const onSubmit = handleSubmit(async (values) => {
        try {
            await ship({
                variables: {
                    orderId: order.id,
                    trackingNumber: values.trackingNumber,
                },
            });
        } catch (shipError) {
            // Apollo hands it back through the hook as well; this keeps an
            // unhandled rejection out of the console.
            console.error("[admin] could not record the waybill", shipError);
        }
    });

    return (
        <Stack as="form" gap="4" onSubmit={onSubmit}>
            <Field.Root required invalid={!!errors.trackingNumber}>
                <Field.Label>Номер накладної</Field.Label>
                <Input
                    placeholder="20450912345678"
                    inputMode="numeric"
                    autoComplete="off"
                    {...register("trackingNumber", {
                        // Pasted numbers come with the spacing they were
                        // printed with. The API strips these too — doing it
                        // here as well means the field shows what was sent.
                        setValueAs: (value: string) =>
                            String(value ?? "").trim().replace(/[\s-]/g, ""),
                        required: "Без номера накладної нема що відправляти",
                        ...(novaPoshta
                            ? {
                                  pattern: {
                                      value: /^\d{14}$/,
                                      message:
                                          "Накладна Нової Пошти — це чотирнадцять цифр",
                                  },
                              }
                            : {}),
                    })}
                />
                <Field.ErrorText>{errors.trackingNumber?.message}</Field.ErrorText>
                <Field.HelperText>
                    {already
                        ? "Замовлення вже відправлене — так виправляють помилку в номері."
                        : "Щойно збережемо — покупець побачить номер і почне стежити."}
                </Field.HelperText>
            </Field.Root>

            <HStack wrap="wrap" gap="3">
                <Button type="submit" colorPalette="purple" loading={loading}>
                    <LuTruck />
                    {already ? "Оновити номер" : "Відправлено"}
                </Button>
            </HStack>

            <Problem error={error} />
        </Stack>
    );
};

/**
 * Calls the order off on the customer's behalf.
 *
 * Two presses on purpose, and not out of politeness: a paid order refunds
 * real money through monobank, and the timeline will say we did it. The reason
 * is the customer's to read on their own order page, so it is worth writing.
 */
const CallOff: FC<OrderActionsProps> = ({ order, refetch }) => {
    const [cancel, { loading, error }] = useCancelAnyOrder();
    const {
        value: confirming,
        setTrue: askToConfirm,
        setFalse: keepIt,
    } = useBoolean(false);

    const { register, handleSubmit, reset } = useForm<CancelValues>({
        defaultValues: { reason: "" },
    });

    const onSubmit = handleSubmit(async (values) => {
        try {
            await cancel({
                variables: {
                    orderId: order.id,
                    reason: values.reason.trim() || null,
                },
            });
            keepIt();
            reset();
            refetch();
        } catch (cancelError) {
            console.error("[admin] could not call the order off", cancelError);
        }
    });

    if (!confirming) {
        return (
            <Stack gap="3" align="start">
                <Button variant="ghost" colorPalette="red" onClick={askToConfirm}>
                    <LuX />
                    Скасувати замовлення
                </Button>
                <Problem error={error} />
            </Stack>
        );
    }

    return (
        <Stack as="form" gap="4" onSubmit={onSubmit}>
            <Alert.Root status="warning" rounded="lg">
                <Alert.Indicator />
                <Alert.Content>
                    <Alert.Title>
                        {order.paidAt
                            ? "Замовлення оплачене — кошти повернуться покупцеві"
                            : "Скасувати це замовлення?"}
                    </Alert.Title>
                    <Alert.Description>
                        {order.paidAt
                            ? "Повернення піде на ту саму картку через monobank. Це кілька банківських днів."
                            : "Рахунок буде відкликано, оплатити його вже не вийде."}
                    </Alert.Description>
                </Alert.Content>
            </Alert.Root>

            <Field.Root>
                <Field.Label>Причина</Field.Label>
                <Input
                    placeholder="Наприклад: немає з чого збирати"
                    autoComplete="off"
                    {...register("reason")}
                />
                <Field.HelperText>
                    Її побачить покупець на сторінці свого замовлення.
                </Field.HelperText>
            </Field.Root>

            <HStack gap="2" wrap="wrap">
                <Button type="submit" colorPalette="red" loading={loading}>
                    {order.paidAt ? "Скасувати й повернути кошти" : "Так, скасувати"}
                </Button>
                <Button variant="ghost" onClick={keepIt} disabled={loading}>
                    Ні, лишити
                </Button>
            </HStack>

            <Problem error={error} />
        </Stack>
    );
};

/**
 * Whatever the API said went wrong, said out loud.
 *
 * The API's refusals are written for developers and in English, and they are
 * shown as they are: this is our own console, and "An order that is SHIPPED
 * cannot go into assembly" tells whoever is packing exactly what happened,
 * where a translated "something went wrong" would not.
 */
const Problem: FC<{ error?: { message: string } | null }> = ({ error }) =>
    error ? (
        <Alert.Root status="error" rounded="lg">
            <Alert.Indicator />
            <Alert.Content>
                <Alert.Title>Не вийшло</Alert.Title>
                <Alert.Description>{error.message}</Alert.Description>
            </Alert.Content>
        </Alert.Root>
    ) : null;

/** The hook already carries the error; this keeps the rejection quiet. */
function swallow(error: unknown) {
    console.error("[admin] the order would not move", error);
}

export default OrderActions;
