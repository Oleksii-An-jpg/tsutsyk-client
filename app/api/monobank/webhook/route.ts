import type { NextRequest } from "next/server";

import {
    verifyWebhookSignature,
    type InvoiceWebhookPayload,
} from "@/app/_lib/monobank";
import { applyInvoiceStatus } from "@/app/_lib/orders";

// Signature verification uses `node:crypto`, so this must not run on the edge.
export const runtime = "nodejs";

/**
 * monopay status callbacks.
 *
 * monobank POSTs here on every invoice status change and retries non-2xx
 * responses, so the only things that may return an error are conditions a
 * retry could actually fix.
 */
export async function POST(request: NextRequest) {
    // Read the raw bytes: the signature covers exactly what was sent, and
    // `JSON.parse` + `JSON.stringify` would not round-trip to the same string.
    const rawBody = await request.text();

    let verified: boolean;
    try {
        verified = await verifyWebhookSignature(
            rawBody,
            request.headers.get("x-sign")
        );
    } catch (error) {
        // Could not reach monobank for the public key. 500 so the callback is
        // redelivered once we can verify it again.
        console.error("[monopay] could not verify webhook signature", error);
        return new Response("Verification unavailable", { status: 500 });
    }

    if (!verified) {
        console.warn("[monopay] rejected webhook with a bad signature");
        return new Response("Invalid signature", { status: 401 });
    }

    let payload: InvoiceWebhookPayload;
    try {
        payload = JSON.parse(rawBody) as InvoiceWebhookPayload;
    } catch {
        // Signed but unparseable — retrying will not help.
        return new Response("Malformed payload", { status: 400 });
    }

    if (!payload.invoiceId || !payload.status) {
        return new Response("Missing invoiceId or status", { status: 400 });
    }

    try {
        const order = await applyInvoiceStatus({
            invoiceId: payload.invoiceId,
            reference: payload.reference,
            status: payload.status,
            failureReason: payload.failureReason,
        });

        if (!order) {
            // Most likely the first webhook overtaking our own write of the
            // order. 404 asks monobank to retry, which resolves that race.
            console.warn(
                `[monopay] no order for invoice ${payload.invoiceId}`
            );
            return new Response("Unknown invoice", { status: 404 });
        }

        if (payload.status === "success") {
            // TODO(fulfilment): this is where the pre-order confirmation email
            // and the assembly queue entry belong.
            console.info(
                `[monopay] order ${order.reference} paid: ${order.quantity}×${order.productId}`
            );
        }

        return new Response(null, { status: 200 });
    } catch (error) {
        // Storage failure — return 500 so monobank redelivers rather than
        // silently dropping a paid order.
        console.error("[monopay] failed to record webhook", error);
        return new Response("Storage error", { status: 500 });
    }
}
