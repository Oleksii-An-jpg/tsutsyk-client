'use client';

import { FC } from "react";
import {
    Alert,
    Badge,
    Button,
    Card,
    Container,
    EmptyState,
    Heading,
    HStack,
    Skeleton,
    Stack,
    Table,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LuInbox, LuRefreshCw } from "react-icons/lu";
import { OrderStatus } from "@/app/_documents/__generated__/globalTypes.codegen";
import { OrderSummaryFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_SUMMARY_FRAGMENT.codegen";
import { useAdminOrders } from "@/app/_lib/useAdminOrders";
import { formatDateTime, formatPrice } from "@/app/_lib/format";
import OrderStatusBadge from "@/app/_components/order/status";

/**
 * The queues somebody actually works from, in the order they are worked.
 *
 * `PAID` leads because it is the only one that is a to-do list: money has
 * arrived and nothing has been built yet. The rest are for looking things up.
 *
 * `null` is "everything" rather than a status, so the filter can say so
 * without a second kind of value meaning the same thing.
 */
const QUEUES: { status: OrderStatus | null; label: string }[] = [
    { status: OrderStatus.Paid, label: "Оплачені" },
    { status: OrderStatus.InAssembly, label: "Збираємо" },
    { status: OrderStatus.Shipped, label: "Відправлені" },
    { status: OrderStatus.PendingPayment, label: "Чекають оплати" },
    { status: OrderStatus.Delivered, label: "Доставлені" },
    { status: null, label: "Усі" },
];

/** What `?status=` may say. Anything else is treated as no filter at all. */
const KNOWN = new Set<string>(Object.values(OrderStatus));

/**
 * tsutsyk.live/admin — every customer's orders, newest first.
 *
 * The rows are deliberately thin: a number, who it is for, where it is going
 * and what state it is in. Everything needed to actually pack one — the full
 * address, the items, the timeline — is a click away, because reading it off
 * a table of fifty is how the wrong parcel gets the wrong waybill.
 */
const AdminOrders: FC = () => {
    const router = useRouter();
    const pathname = usePathname();
    const params = useSearchParams();

    const asked = params.get("status");
    const status = asked && KNOWN.has(asked) ? (asked as OrderStatus) : null;

    const { data, loading, error, refetch } = useAdminOrders({ status });

    function show(next: OrderStatus | null) {
        // Replace rather than push: flicking between queues is looking at one
        // thing from different angles, not somewhere to come back to, and it
        // should not take six presses of Back to leave the panel.
        router.replace(next ? `${pathname}?status=${next}` : pathname);
    }

    const orders = data?.getOrders ?? [];

    return (
        <Container maxW="6xl" py={{ base: 6, md: 10 }}>
            <Stack gap="6">
                <HStack justify="space-between" wrap="wrap" gap="3">
                    <Heading size="xl">Замовлення</Heading>
                    <Button
                        size="sm"
                        variant="outline"
                        rounded="full"
                        loading={loading}
                        onClick={() => void refetch()}
                    >
                        <LuRefreshCw />
                        Оновити
                    </Button>
                </HStack>

                <HStack wrap="wrap" gap="2">
                    {QUEUES.map((queue) => (
                        <Button
                            key={queue.label}
                            size="sm"
                            rounded="full"
                            variant={queue.status === status ? "solid" : "outline"}
                            colorPalette={queue.status === status ? "blue" : undefined}
                            onClick={() => show(queue.status)}
                        >
                            {queue.label}
                        </Button>
                    ))}
                </HStack>

                {error && (
                    <Alert.Root status="error" rounded="xl">
                        <Alert.Indicator />
                        <Alert.Content>
                            <Alert.Title>Не вдалося прочитати замовлення</Alert.Title>
                            <Alert.Description>{error.message}</Alert.Description>
                        </Alert.Content>
                    </Alert.Root>
                )}

                <Card.Root>
                    <Card.Body p="0">
                        {/* `loading` with rows already on screen is a refetch,
                            not a first read — showing skeletons then would
                            blank a list somebody is reading. */}
                        {loading && orders.length === 0 ? (
                            <Stack gap="3" p="4">
                                {[0, 1, 2, 3].map((row) => (
                                    <Skeleton key={row} height="10" rounded="md" />
                                ))}
                            </Stack>
                        ) : orders.length === 0 ? (
                            <Empty filtered={status !== null} />
                        ) : (
                            <Queue orders={orders} />
                        )}
                    </Card.Body>
                </Card.Root>

                {orders.length > 0 && (
                    <Text fontSize="xs" color="fg.muted">
                        {orders.length} {orders.length === 1 ? "замовлення" : "замовлень"}
                        {orders.length === 50 && " — показано найновіші"}
                    </Text>
                )}
            </Stack>
        </Container>
    );
};

const Queue: FC<{ orders: readonly OrderSummaryFragmentFragment[] }> = ({ orders }) => (
    <Table.ScrollArea>
        <Table.Root size="sm" variant="line" interactive>
            <Table.Header>
                <Table.Row>
                    <Table.ColumnHeader>Номер</Table.ColumnHeader>
                    <Table.ColumnHeader>Отримувач</Table.ColumnHeader>
                    <Table.ColumnHeader>Куди</Table.ColumnHeader>
                    <Table.ColumnHeader>Створено</Table.ColumnHeader>
                    <Table.ColumnHeader textAlign="end">Сума</Table.ColumnHeader>
                    <Table.ColumnHeader>Стан</Table.ColumnHeader>
                    <Table.ColumnHeader />
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {orders.map((order) => (
                    <Table.Row key={order.id}>
                        <Table.Cell fontWeight="semibold" whiteSpace="nowrap">
                            {order.id}
                        </Table.Cell>
                        <Table.Cell>{order.delivery?.recipientName ?? "—"}</Table.Cell>
                        <Table.Cell>
                            {order.delivery?.city ? (
                                <Text>
                                    {order.delivery.city}
                                    {order.delivery.branch && (
                                        <Text as="span" color="fg.muted">
                                            {" "}
                                            · №{order.delivery.branch}
                                        </Text>
                                    )}
                                </Text>
                            ) : (
                                "—"
                            )}
                        </Table.Cell>
                        <Table.Cell whiteSpace="nowrap" color="fg.muted">
                            {formatDateTime(order.createdAt)}
                        </Table.Cell>
                        <Table.Cell textAlign="end" whiteSpace="nowrap">
                            {formatPrice(order.amount)}
                        </Table.Cell>
                        <Table.Cell>
                            <Stack gap="1" align="start">
                                <OrderStatusBadge status={order.status} size="sm" />
                                {/* The waybill is the one thing worth seeing
                                    without opening the order — it is what a
                                    customer rings up about. */}
                                {order.trackingNumber && (
                                    <Badge size="sm" variant="outline" rounded="full">
                                        {order.trackingNumber}
                                    </Badge>
                                )}
                            </Stack>
                        </Table.Cell>
                        <Table.Cell textAlign="end">
                            <Button asChild size="xs" variant="outline" rounded="full">
                                <Link href={`/admin/orders/${order.id}`}>Відкрити</Link>
                            </Button>
                        </Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table.Root>
    </Table.ScrollArea>
);

const Empty: FC<{ filtered: boolean }> = ({ filtered }) => (
    <EmptyState.Root>
        <EmptyState.Content>
            <EmptyState.Indicator>
                <LuInbox />
            </EmptyState.Indicator>
            <EmptyState.Title>Тут порожньо</EmptyState.Title>
            <EmptyState.Description>
                {filtered
                    ? "У цьому стані немає жодного замовлення."
                    : "Ще ніхто нічого не замовив."}
            </EmptyState.Description>
        </EmptyState.Content>
    </EmptyState.Root>
);

export default AdminOrders;
