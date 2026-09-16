/**
 * Order records for monopay checkouts, stored in Firestore.
 *
 * An order is written *before* the buyer is sent to monobank, so a payment can
 * never arrive for something we have no record of. After that `status` only
 * ever changes to whatever monobank reports — from the webhook, or from the
 * order page reconciling against the status endpoint. Both write the same
 * value, so they are safe to race.
 *
 * `admin.ts` calls `initializeApp` at module scope, so it is imported lazily
 * here — a top-level import would force Firebase credentials to exist whenever
 * anything in this module graph is loaded, including at build time.
 */

import type { Firestore } from "firebase-admin/firestore";
import type { InvoiceStatus } from "@/app/_lib/monobank";

const COLLECTION = "orders";

export type Order = {
    /** Our order id, and the Firestore document id. */
    reference: string;
    invoiceId: string;
    productId: string;
    quantity: number;
    /** Total charged, in minor units (kopiykas). */
    amount: number;
    ccy: number;
    status: InvoiceStatus;
    failureReason?: string;
    createdAt: string;
    updatedAt: string;
};

async function db(): Promise<Firestore> {
    const { adminDb } = await import("@/app/_lib/admin");
    return adminDb;
}

export async function createOrder(
    order: Omit<Order, "createdAt" | "updatedAt">
): Promise<void> {
    const now = new Date().toISOString();
    const store = await db();
    await store
        .collection(COLLECTION)
        .doc(order.reference)
        .set({ ...order, createdAt: now, updatedAt: now });
}

export async function getOrder(reference: string): Promise<Order | null> {
    const store = await db();
    const snapshot = await store.collection(COLLECTION).doc(reference).get();
    return snapshot.exists ? (snapshot.data() as Order) : null;
}

/**
 * Applies a status change from a webhook.
 *
 * Looks the order up by `reference` (which we set on the invoice and monobank
 * echoes back) and falls back to `invoiceId` if it is missing. Returns the
 * updated order, or `null` when we have no matching record — the caller decides
 * whether that is worth a retry.
 */
export async function applyInvoiceStatus(update: {
    invoiceId: string;
    reference?: string;
    status: InvoiceStatus;
    failureReason?: string;
}): Promise<Order | null> {
    const store = await db();
    const collection = store.collection(COLLECTION);

    let doc = update.reference
        ? await collection.doc(update.reference).get()
        : null;

    if (!doc?.exists) {
        const matches = await collection
            .where("invoiceId", "==", update.invoiceId)
            .limit(1)
            .get();
        doc = matches.empty ? null : matches.docs[0];
    }

    if (!doc?.exists) return null;

    const patch = {
        status: update.status,
        updatedAt: new Date().toISOString(),
        // Firestore rejects `undefined`, so only write a reason when there is one.
        ...(update.failureReason ? { failureReason: update.failureReason } : {}),
    };

    await doc.ref.update(patch);
    return { ...(doc.data() as Order), ...patch };
}
