/**
 * Payment records, written by the monopay webhook.
 *
 * With the widget flow our server never creates the invoice, so the webhook is
 * the first time we hear about a payment at all — this writes the record rather
 * than updating one.
 *
 * `admin.ts` calls `initializeApp` at module scope, so it is imported lazily:
 * a top-level import would force Firebase credentials to exist whenever
 * anything in this module graph is loaded, including at build time.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { InvoiceStatus, InvoiceWebhookPayload } from "@/app/_lib/monobank";

const COLLECTION = "payments";

/** A status no later webhook can move away from. */
function isFinal(status: InvoiceStatus): boolean {
    return (
        status === "success" ||
        status === "failure" ||
        status === "reversed" ||
        status === "expired"
    );
}

async function db(): Promise<Firestore> {
    const { adminDb } = await import("@/app/_lib/admin");
    return adminDb;
}

/**
 * Records a status change, keyed by invoice.
 *
 * Idempotent, because monobank retries: redelivering the same webhook rewrites
 * the same values. Deliveries can also arrive out of order, so a status that
 * has already settled is never walked back to an in-flight one.
 *
 * Returns whether this call moved the payment to a new status, so the caller
 * can decide if there is anything to act on.
 */
export async function recordPayment(
    payload: InvoiceWebhookPayload
): Promise<{ changed: boolean }> {
    const store = await db();
    const ref = store.collection(COLLECTION).doc(payload.invoiceId);
    const now = new Date().toISOString();

    return store.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const previous = snapshot.exists
            ? (snapshot.data() as { status?: InvoiceStatus })
            : null;

        if (previous?.status === payload.status) {
            return { changed: false };
        }

        // A late in-flight delivery must not overwrite a settled payment.
        if (previous?.status && isFinal(previous.status) && !isFinal(payload.status)) {
            console.warn(
                `[monopay] ignoring late "${payload.status}" for settled invoice ${payload.invoiceId}`
            );
            return { changed: false };
        }

        tx.set(
            ref,
            {
                invoiceId: payload.invoiceId,
                status: payload.status,
                amount: payload.amount,
                ccy: payload.ccy,
                // Firestore rejects `undefined`, so only write what is present.
                ...(payload.reference ? { reference: payload.reference } : {}),
                ...(payload.failureReason
                    ? { failureReason: payload.failureReason }
                    : {}),
                ...(snapshot.exists ? {} : { createdAt: now }),
                updatedAt: now,
            },
            { merge: true }
        );

        return { changed: true };
    });
}
