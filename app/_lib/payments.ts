/**
 * Payment records, written by the acquiring webhook.
 *
 * `admin.ts` calls `initializeApp` at module scope, so it is imported lazily:
 * a top-level import would force Firebase credentials to exist whenever
 * anything in this module graph is loaded, including at build time.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { InvoiceStatus, InvoiceWebhookPayload } from "@/app/_lib/monobank";

const COLLECTION = "payments";

export type Payment = {
    invoiceId: string;
    status: InvoiceStatus;
    amount: number;
    ccy: number;
    reference?: string;
    failureReason?: string;
    /** monobank's own timestamp, and the tiebreaker between two webhooks. */
    modifiedDate?: string;
    createdAt: string;
    updatedAt: string;
};

/** A status no later webhook can move away from. */
function isFinal(status: InvoiceStatus): boolean {
    return (
        status === "success" ||
        status === "failure" ||
        status === "reversed" ||
        status === "expired"
    );
}

/**
 * Whether `incoming` describes a later state of the invoice than `stored`.
 *
 * monobank does not guarantee webhook ordering — the docs warn that `success`
 * can arrive before the `processing` that preceded it — and say the payload
 * with the greater `modifiedDate` is the current one. So that field decides,
 * not arrival order.
 *
 * When a timestamp is missing on either side there is nothing to compare, and
 * we fall back to refusing to walk a settled payment back to an in-flight one.
 */
function supersedes(
    incoming: InvoiceWebhookPayload,
    stored: Pick<Payment, "status" | "modifiedDate">
): boolean {
    if (incoming.modifiedDate && stored.modifiedDate) {
        return incoming.modifiedDate > stored.modifiedDate;
    }
    return !(isFinal(stored.status) && !isFinal(incoming.status));
}

async function db(): Promise<Firestore> {
    const { adminDb } = await import("@/app/_lib/admin");
    return adminDb;
}

export async function getPayment(invoiceId: string): Promise<Payment | null> {
    const store = await db();
    const snapshot = await store.collection(COLLECTION).doc(invoiceId).get();
    return snapshot.exists ? (snapshot.data() as Payment) : null;
}

/**
 * Records a status change, keyed by invoice.
 *
 * Idempotent, because monobank retries: redelivering the same webhook rewrites
 * the same values. Returns whether this call actually advanced the payment, so
 * the caller can fire fulfilment exactly once.
 */
export async function recordPayment(
    payload: InvoiceWebhookPayload
): Promise<{ changed: boolean }> {
    const store = await db();
    const ref = store.collection(COLLECTION).doc(payload.invoiceId);
    const now = new Date().toISOString();

    return store.runTransaction(async (tx) => {
        const snapshot = await tx.get(ref);
        const stored = snapshot.exists ? (snapshot.data() as Payment) : null;

        if (stored) {
            if (stored.status === payload.status) {
                return { changed: false };
            }
            if (!supersedes(payload, stored)) {
                console.warn(
                    `[acquiring] ignoring stale "${payload.status}" for invoice ${payload.invoiceId}`
                );
                return { changed: false };
            }
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
                ...(payload.modifiedDate
                    ? { modifiedDate: payload.modifiedDate }
                    : {}),
                ...(stored ? {} : { createdAt: now }),
                updatedAt: now,
            },
            { merge: true }
        );

        return { changed: true };
    });
}
