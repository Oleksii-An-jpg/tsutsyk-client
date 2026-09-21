'use client';

import { FC } from "react";
import {
    AbsoluteCenter,
    Alert,
    Box,
    Button,
    Card,
    Clipboard,
    Container,
    DataList,
    Heading,
    HStack,
    Separator,
    Spinner,
    Stack,
    Table,
    Text,
    Timeline,
} from "@chakra-ui/react";
import Link from "next/link";
import { LuArrowLeft, LuCopy } from "react-icons/lu";
import { OrderFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import { useAnyOrder } from "@/app/_lib/useAdminOrders";
import { useOrderUpdates } from "@/app/_lib/useOrders";
import { formatDateTime, formatPrice } from "@/app/_lib/format";
import OrderStatusBadge, {
    orderStatusLabel,
    paymentStatusLabel,
} from "@/app/_components/order/status";
import OrderActions from "@/app/_components/admin/order/actions";

type AdminOrderProps = {
    id: string;
};

/** How each delivery method reads. Unknown ones show as themselves. */
const DELIVERY_METHOD: Record<string, string> = {
    NOVA_POSHTA_BRANCH: "Нова Пошта, відділення",
    NOVA_POSHTA_COURIER: "Нова Пошта, курʼєр",
    UKRPOSHTA: "Укрпошта",
    PICKUP: "Самовивіз",
};

/** Who each timeline entry was. The customer's own page does not show this. */
const ACTOR: Record<string, string> = {
    CUSTOMER: "покупець",
    MONOBANK: "monobank",
    SYSTEM: "система",
    ADMIN: "ми",
};

/**
 * tsutsyk.live/admin/orders/<number> — one order, as the person packing it
 * needs to see it.
 *
 * The same order the customer reads at /orders/<number>, laid out for a
 * different job. There the address is a form to correct; here it is text to
 * copy onto a waybill, so it comes first and comes with a copy button. The
 * money and the items sit below it — they are already settled by the time
 * anything reaches this page.
 */
const AdminOrder: FC<AdminOrderProps> = ({ id }) => {
    const { data, loading, error, refetch } = useAnyOrder(id);

    // The same subscription the customer's page uses. It carries no token —
    // it is guarded by knowing the order number — so it works here too, and
    // it means a payment landing as a webhook shows up without a reload.
    useOrderUpdates(id, () => void refetch());

    if (loading && !data) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    const order = data?.getAnyOrder;

    if (!order) {
        return (
            <Container maxW="3xl" py={{ base: 6, md: 10 }}>
                <Alert.Root status="warning" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Замовлення {id} не знайдено</Alert.Title>
                        <Alert.Description>
                            <Stack align="start" gap="3">
                                <Text>
                                    {/* The API answers `null` for a number that does
                                        not exist and an error for a claim that has
                                        lapsed. Both end up here, and the difference
                                        is worth saying out loud. */}
                                    {error
                                        ? error.message
                                        : "Перевірте номер — можливо, у ньому є помилка."}
                                </Text>
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/admin">До списку</Link>
                                </Button>
                            </Stack>
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            </Container>
        );
    }

    return (
        <Container maxW="4xl" py={{ base: 6, md: 10 }}>
            <Stack gap="6">
                <Stack gap="4">
                    <Button asChild size="xs" variant="ghost" alignSelf="start">
                        <Link href="/admin">
                            <LuArrowLeft />
                            До списку
                        </Link>
                    </Button>

                    <HStack justify="space-between" wrap="wrap" gap="3">
                        <Stack gap="1">
                            <Heading size="xl">{order.id}</Heading>
                            <Text fontSize="sm" color="fg.muted">
                                Створене {formatDateTime(order.createdAt)}
                            </Text>
                        </Stack>
                        <OrderStatusBadge status={order.status} size="lg" />
                    </HStack>
                </Stack>

                <Delivery order={order} />

                <OrderActions order={order} refetch={() => void refetch()} />

                <Money order={order} />

                <Card.Root>
                    <Card.Header>
                        <Heading size="md">Що відбувалося</Heading>
                    </Card.Header>
                    <Card.Body>
                        <History order={order} />
                    </Card.Body>
                </Card.Root>
            </Stack>
        </Container>
    );
};

/**
 * Everything that goes on the waybill, and a button that puts it on the
 * clipboard.
 *
 * The copy exists because the alternative is retyping a Ukrainian name and a
 * branch number into Nova Poshta's cabinet by hand, and a parcel with a
 * mistyped recipient is one nobody can collect.
 */
const Delivery: FC<{ order: OrderFragmentFragment }> = ({ order }) => {
    const delivery = order.delivery;

    const waybill = [
        delivery?.recipientName,
        delivery?.phone,
        delivery?.city,
        delivery?.branch && `Відділення №${delivery.branch}`,
        delivery?.address,
    ]
        .filter(Boolean)
        .join("\n");

    return (
        <Card.Root borderColor="orange.emphasized" borderWidth="1px">
            <Card.Header>
                <HStack justify="space-between" wrap="wrap" gap="3">
                    <Heading size="md">Куди везти</Heading>
                    {waybill && (
                        <Clipboard.Root value={waybill}>
                            <Clipboard.Trigger asChild>
                                <Button size="xs" variant="outline" rounded="full">
                                    <Clipboard.Indicator copied="Скопійовано">
                                        <LuCopy />
                                    </Clipboard.Indicator>
                                    Скопіювати
                                </Button>
                            </Clipboard.Trigger>
                        </Clipboard.Root>
                    )}
                </HStack>
            </Card.Header>
            <Card.Body>
                {delivery ? (
                    <Stack gap="4">
                        <DataList.Root orientation="horizontal" divideY="1px">
                            <Row label="Отримувач" value={delivery.recipientName} />
                            <Row label="Телефон" value={delivery.phone} />
                            <Row
                                label="Спосіб"
                                value={DELIVERY_METHOD[delivery.method] ?? delivery.method}
                            />
                            {delivery.city && <Row label="Місто" value={delivery.city} />}
                            {delivery.branch && (
                                <Row label="Відділення" value={`№${delivery.branch}`} />
                            )}
                            {delivery.address && (
                                <Row label="Адреса" value={delivery.address} />
                            )}
                            {delivery.comment && (
                                <Row label="Коментар" value={delivery.comment} />
                            )}
                        </DataList.Root>

                        {/* The customer's own contact details, which need not be
                            the recipient's — a tracker bought as a present has
                            somebody else's name and phone on the parcel. */}
                        {(order.contactPhone || order.contactEmail) && (
                            <>
                                <Separator />
                                <Stack gap="1">
                                    <Text fontSize="sm" color="fg.muted">
                                        Покупець
                                    </Text>
                                    <Text fontSize="sm">
                                        {[order.contactPhone, order.contactEmail]
                                            .filter(Boolean)
                                            .join(" · ")}
                                    </Text>
                                </Stack>
                            </>
                        )}

                        {!order.editable && (
                            <Text fontSize="xs" color="fg.muted">
                                Покупець уже не може змінити ці дані — адреса
                                зафіксована.
                            </Text>
                        )}
                    </Stack>
                ) : (
                    <Text color="fg.muted">
                        Дані доставки не вказані — звʼяжіться з покупцем.
                    </Text>
                )}
            </Card.Body>
        </Card.Root>
    );
};

const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
    <DataList.Item pt="2">
        <DataList.ItemLabel>{label}</DataList.ItemLabel>
        <DataList.ItemValue fontWeight="medium" color="fg">
            {value}
        </DataList.ItemValue>
    </DataList.Item>
);

const Money: FC<{ order: OrderFragmentFragment }> = ({ order }) => {
    const payment = paymentStatusLabel(order.paymentStatus);

    return (
        <Card.Root>
            <Card.Header>
                <Heading size="md">Гроші й товар</Heading>
            </Card.Header>
            <Card.Body>
                <Stack gap="5">
                    <HStack justify="space-between" wrap="wrap" gap="3">
                        <Stack gap="1">
                            <Text fontSize="sm" color="fg.muted">
                                Сума
                            </Text>
                            <Heading size="lg">{formatPrice(order.amount)}</Heading>
                        </Stack>
                        <Stack gap="1" textAlign={{ base: "left", sm: "right" }}>
                            <Text fontSize="sm" color="fg.muted">
                                Оплата
                            </Text>
                            <Text fontWeight="medium">
                                {payment ?? "ще не починалася"}
                            </Text>
                            {order.paidAt && (
                                <Text fontSize="xs" color="fg.muted">
                                    {formatDateTime(order.paidAt)}
                                </Text>
                            )}
                        </Stack>
                    </HStack>

                    {order.failureReason && (
                        <Text fontSize="sm" color="red.fg">
                            {order.failureReason}
                        </Text>
                    )}

                    {order.cancelReason && (
                        <Text fontSize="sm" color="fg.muted">
                            Причина скасування: {order.cancelReason}
                        </Text>
                    )}

                    <Separator />

                    <Table.Root size="sm" variant="line">
                        <Table.Body>
                            {order.items.map((item) => (
                                <Table.Row key={item.productId}>
                                    <Table.Cell>
                                        <Text fontWeight="medium">{item.name}</Text>
                                        <Text fontSize="xs" color="fg.muted">
                                            {item.quantity} {item.unit} ×{" "}
                                            {formatPrice(item.unitPrice)}
                                        </Text>
                                    </Table.Cell>
                                    <Table.Cell textAlign="end">
                                        {formatPrice(item.sum)}
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>

                    {/* Only ours to see: the customer's page has a pay button
                        instead, and the invoice id is what monobank's own
                        cabinet is searched by when something goes wrong. */}
                    {order.invoiceId && (
                        <Text fontSize="xs" color="fg.muted">
                            monobank invoice: {order.invoiceId}
                        </Text>
                    )}
                </Stack>
            </Card.Body>
        </Card.Root>
    );
};

const History: FC<{ order: OrderFragmentFragment }> = ({ order }) => (
    <Timeline.Root size="sm">
        {[...order.events].reverse().map((entry, index) => (
            <Timeline.Item key={`${entry.at}-${index}`}>
                <Timeline.Connector>
                    <Timeline.Separator />
                    <Timeline.Indicator />
                </Timeline.Connector>
                <Timeline.Content>
                    <Timeline.Title>
                        {entry.note ?? orderStatusLabel(entry.status)}
                    </Timeline.Title>
                    <Timeline.Description>
                        {formatDateTime(entry.at)} · {ACTOR[entry.actor] ?? entry.actor}
                    </Timeline.Description>
                </Timeline.Content>
            </Timeline.Item>
        ))}
        {order.events.length === 0 && (
            <Box>
                <Text fontSize="sm" color="fg.muted">
                    Поки нічого не сталося.
                </Text>
            </Box>
        )}
    </Timeline.Root>
);

export default AdminOrder;
