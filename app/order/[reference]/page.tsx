import type { Metadata } from "next";
import { notFound } from "next/navigation";

import OrderStatus from "@/app/_components/order-status";
import { getInvoiceStatus, isFinalStatus } from "@/app/_lib/monobank";
import { applyInvoiceStatus, getOrder } from "@/app/_lib/orders";
import { formatPrice, getProduct } from "@/app/_lib/products";

type PageProps = {
    params: Promise<{ reference: string }>;
};

export const metadata: Metadata = {
    title: "Замовлення · Tsutsyk Live",
    // A payment receipt has no business in search results.
    robots: { index: false, follow: false },
};

export default async function Page({ params }: PageProps) {
    const { reference } = await params;

    const order = await getOrder(reference);
    if (!order) notFound();

    let status = order.status;
    let failureReason = order.failureReason;

    // monobank redirects the buyer here the moment they finish paying, which
    // usually beats its own webhook. Ask monobank directly rather than showing
    // a stale "awaiting payment" to someone who has just paid.
    if (!isFinalStatus(status)) {
        try {
            const live = await getInvoiceStatus(order.invoiceId);
            if (live.status !== status) {
                status = live.status;
                failureReason = live.failureReason;
                // Idempotent: writes whatever monobank just told us, so a lost
                // webhook does not leave the order stuck forever.
                await applyInvoiceStatus({
                    invoiceId: order.invoiceId,
                    reference: order.reference,
                    status: live.status,
                    failureReason: live.failureReason,
                });
            }
        } catch (error) {
            // Fall back to the stored status — the webhook will catch up.
            console.error("[monopay] could not refresh invoice status", error);
        }
    }

    const product = getProduct(order.productId);

    return (
        <OrderStatus
            reference={order.reference}
            status={status}
            productName={product?.name ?? order.productId}
            quantity={order.quantity}
            total={formatPrice(order.amount)}
            failureReason={failureReason}
        />
    );
}
