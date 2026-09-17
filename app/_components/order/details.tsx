'use client';

import { FC } from "react";
import {
    Box,
    Button,
    Card,
    Heading,
    HStack,
    Separator,
    Stack,
    Table,
    Text,
    Timeline,
} from "@chakra-ui/react";
import { useBoolean } from "usehooks-ts";
import { LuCreditCard, LuRefreshCw, LuX } from "react-icons/lu";
import { OrderFragmentFragment } from "@/app/_documents/fragments/__generated__/ORDER_FRAGMENT.codegen";
import { formatDateTime, formatPrice } from "@/app/_lib/format";
import {
    useCancelOrder,
    useOrderUpdates,
    useRefreshOrderPayment,
    useRetryOrderPayment,
} from "@/app/_lib/useOrders";
import OrderStatusBadge, {
    orderStatusLabel,
    paymentStatusLabel,
} from "@/app/_components/order/status";
import DeliveryForm from "@/app/_components/order/delivery-form";

type OrderDetailsProps = {
    order: OrderFragmentFragment;
    /** Re-reads the order after something changes it elsewhere. */
    refetch: () => void;
};

const OrderDetails: FC<OrderDetailsProps> = ({ order, refetch }) => {
    // The payment is confirmed by a webhook the API receives, not by anything
    // this page asked for — so the page listens instead of guessing.
    useOrderUpdates(order.id, refetch);

    return (
        <Stack gap="6">
            <Card.Root>
                <Card.Header>
                    <HStack justify="space-between" wrap="wrap" gap="3">
                        <Stack gap="1">
                            <Heading size="md">Замовлення {order.id}</Heading>
                            <Text fontSize="sm" color="fg.muted">
                                Створене {formatDateTime(order.createdAt)}
                            </Text>
                        </Stack>
                        <OrderStatusBadge status={order.status} size="lg" />
                    </HStack>
                </Card.Header>

                <Card.Body>
                    <Stack gap="5">
                        <Payment order={order} refetch={refetch} />

                        <Separator />

                        <Items order={order} />

                        {order.trackingNumber && (
                            <>
                                <Separator />
                                <Stack gap="1">
                                    <Text fontSize="sm" color="fg.muted">
                                        Номер відправлення
                                    </Text>
                                    <Text fontWeight="medium">{order.trackingNumber}</Text>
                                </Stack>
                            </>
                        )}
                    </Stack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Heading size="md">Доставка</Heading>
                </Card.Header>
                <Card.Body>
                    <DeliveryForm order={order} />
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Heading size="md">Що відбувалося</Heading>
                </Card.Header>
                <Card.Body>
                    <History order={order} />
                </Card.Body>
            </Card.Root>
        </Stack>
    );
};

const Payment: FC<OrderDetailsProps> = ({ order, refetch }) => {
    const [retry, { loading: retrying }] = useRetryOrderPayment();
    const [refresh, { loading: refreshing }] = useRefreshOrderPayment();
    const [cancel, { loading: cancelling }] = useCancelOrder();
    const { value: confirming, setTrue: askToConfirm, setFalse: keepIt } = useBoolean(false);

    const payment = paymentStatusLabel(order.paymentStatus);

    async function payAgain() {
        const { data } = await retry({ variables: { orderId: order.id } });
        const pageUrl = data?.retryOrderPayment.pageUrl;
        // A payment page is monobank's, not ours, so this leaves the app.
        if (pageUrl) window.location.assign(pageUrl);
    }

    async function callItOff() {
        await cancel({ variables: { orderId: order.id, reason: null } });
        keepIt();
        refetch();
    }

    return (
        <Stack gap="4">
            <HStack justify="space-between" wrap="wrap" gap="3">
                <Stack gap="1">
                    <Text fontSize="sm" color="fg.muted">
                        До сплати
                    </Text>
                    <Heading size="lg">{formatPrice(order.amount)}</Heading>
                </Stack>
                <Stack gap="1" textAlign={{ base: "left", sm: "right" }}>
                    <Text fontSize="sm" color="fg.muted">
                        Оплата
                    </Text>
                    <Text fontWeight="medium">{payment ?? "ще не починалася"}</Text>
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

            <HStack wrap="wrap" gap="3">
                {order.payable && order.paymentPageUrl && (
                    <Button asChild colorPalette="orange">
                        {/* Straight to the open invoice — no need to make a new one. */}
                        <a href={order.paymentPageUrl}>
                            <LuCreditCard />
                            Оплатити
                        </a>
                    </Button>
                )}

                {order.payable && !order.paymentPageUrl && (
                    <Button colorPalette="orange" loading={retrying} onClick={payAgain}>
                        <LuCreditCard />
                        Виставити новий рахунок
                    </Button>
                )}

                {order.payable && (
                    <Button
                        variant="outline"
                        loading={refreshing}
                        onClick={() => refresh({ variables: { orderId: order.id } })}
                    >
                        <LuRefreshCw />
                        Перевірити оплату
                    </Button>
                )}

                {order.cancellable &&
                    (confirming ? (
                        <HStack gap="2">
                            <Button
                                colorPalette="red"
                                loading={cancelling}
                                onClick={callItOff}
                            >
                                Так, скасувати
                            </Button>
                            <Button variant="ghost" onClick={keepIt}>
                                Ні, лишити
                            </Button>
                        </HStack>
                    ) : (
                        <Button variant="ghost" onClick={askToConfirm}>
                            <LuX />
                            Скасувати замовлення
                        </Button>
                    ))}
            </HStack>

            {order.cancellable && confirming && order.paidAt && (
                <Text fontSize="sm" color="fg.muted">
                    Кошти повернемо на ту саму картку — зазвичай це кілька банківських днів.
                </Text>
            )}
        </Stack>
    );
};

const Items: FC<{ order: OrderFragmentFragment }> = ({ order }) => (
    <Table.Root size="sm" variant="line">
        <Table.Body>
            {order.items.map((item) => (
                <Table.Row key={item.productId}>
                    <Table.Cell>
                        <Text fontWeight="medium">{item.name}</Text>
                        <Text fontSize="xs" color="fg.muted">
                            {item.quantity} {item.unit} × {formatPrice(item.unitPrice)}
                        </Text>
                    </Table.Cell>
                    <Table.Cell textAlign="end">{formatPrice(item.sum)}</Table.Cell>
                </Table.Row>
            ))}
        </Table.Body>
    </Table.Root>
);

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
                        {formatDateTime(entry.at)}
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

export default OrderDetails;
