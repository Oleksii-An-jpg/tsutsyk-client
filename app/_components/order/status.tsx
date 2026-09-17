'use client';

import { FC } from "react";
import { Badge } from "@chakra-ui/react";

/**
 * How each status reads to a customer.
 *
 * Keyed by the plain string rather than the generated enum: this is display
 * copy, and a status the API grows before this page knows about it should
 * show up as itself, not crash the page.
 */
const ORDER_STATUS: Record<string, { label: string; palette: string }> = {
    PENDING_PAYMENT: { label: "Очікує оплати", palette: "orange" },
    PAID: { label: "Оплачено", palette: "green" },
    IN_ASSEMBLY: { label: "Збираємо", palette: "blue" },
    SHIPPED: { label: "Відправлено", palette: "purple" },
    DELIVERED: { label: "Доставлено", palette: "green" },
    CANCELLED: { label: "Скасовано", palette: "gray" },
    REFUNDED: { label: "Кошти повернуто", palette: "gray" },
};

const PAYMENT_STATUS: Record<string, string> = {
    CREATED: "рахунок виставлено",
    PROCESSING: "оплата обробляється",
    HOLD: "кошти зарезервовано",
    SUCCESS: "оплату отримано",
    FAILURE: "оплата не пройшла",
    REVERSED: "кошти повернуто",
    EXPIRED: "термін дії рахунку минув",
};

export function orderStatusLabel(status: string): string {
    return ORDER_STATUS[status]?.label ?? status;
}

export function paymentStatusLabel(status?: string | null): string | null {
    if (!status) return null;
    return PAYMENT_STATUS[status] ?? status;
}

const OrderStatusBadge: FC<{ status: string; size?: "sm" | "md" | "lg" }> = ({
    status,
    size = "md",
}) => (
    <Badge
        size={size}
        variant="subtle"
        rounded="full"
        colorPalette={ORDER_STATUS[status]?.palette ?? "gray"}
    >
        {orderStatusLabel(status)}
    </Badge>
);

export default OrderStatusBadge;
