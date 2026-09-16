import type { NextRequest } from "next/server";

import {
    verifyWebhookSignature,
    type InvoiceWebhookPayload,
} from "@/app/_lib/monobank";
import { recordPayment } from "@/app/_lib/payments";

// Signature verification uses `node:crypto`, so this must not run on the edge.
export const runtime = "nodejs";

/**
 * monopay status callbacks.
 *
 * This is the only trustworthy signal that a payment happened — the widget's
 * `onSuccess` runs in the buyer's browser and can be faked.
 *
 * monobank retries non-2xx responses, so the only things that return an error
 * are conditions a retry could actually fix.
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
        const { changed } = await recordPayment(payload);

        if (changed && payload.status === "success") {
            // TODO(fulfilment): the pre-order confirmation and the assembly
            // queue entry belong here. Guarded by `changed` so a redelivery
            // cannot send a second confirmation.
            console.info(
                `[monopay] invoice ${payload.invoiceId} paid: ${payload.amount} (${payload.ccy})`
            );
        }

        return new Response(null, { status: 200 });
    } catch (error) {
        // Storage failure — 500 so monobank redelivers rather than letting a
        // paid order vanish.
        console.error("[monopay] failed to record webhook", error);
        return new Response("Storage error", { status: 500 });
    }
}
