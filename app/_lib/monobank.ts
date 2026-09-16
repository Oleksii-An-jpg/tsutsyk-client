/**
 * Webhook signature verification.
 *
 * monobank signs the raw webhook body with the merchant key and sends the
 * base64 ECDSA-SHA256 signature in `X-Sign`. The matching public key comes from
 * `GET /api/merchant/pubkey`, which needs the merchant token.
 *
 * Docs: https://monobank.ua/api-docs/acquiring/dev/webhooks/verify
 *
 * This is the only monobank API we call — the widget creates the invoice, so
 * there is nothing here for invoice create or status.
 */

import { createVerify } from "node:crypto";

const API_BASE = process.env.MONOBANK_API_BASE ?? "https://api.monobank.ua";

export type InvoiceStatus =
    | "created"
    | "processing"
    | "hold"
    | "success"
    | "failure"
    | "reversed"
    | "expired";

/** What monobank POSTs to the webhook. */
export type InvoiceWebhookPayload = {
    invoiceId: string;
    status: InvoiceStatus;
    failureReason?: string;
    amount: number;
    ccy: number;
    /** Our own order id, if monobank echoes it back from the signed payload. */
    reference?: string;
    createdDate?: string;
    modifiedDate?: string;
};

async function fetchPublicKey(): Promise<string> {
    const token = process.env.MONOBANK_ACQUIRING_TOKEN;
    if (!token) {
        throw new Error("MONOBANK_ACQUIRING_TOKEN is not set — see .env.example");
    }

    const response = await fetch(`${API_BASE}/api/merchant/pubkey`, {
        headers: { "X-Token": token },
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(
            `could not fetch the monobank public key: ${response.status}`
        );
    }

    const { key } = (await response.json()) as { key: string };
    // The endpoint returns the PEM itself, base64-encoded.
    return Buffer.from(key, "base64").toString("utf8");
}

// Memoised: the key only changes when the merchant rotates it, which is why a
// failed check refetches once before giving up.
let cachedPublicKey: string | null = null;

async function getPublicKey(forceRefresh = false): Promise<string> {
    if (!cachedPublicKey || forceRefresh) {
        cachedPublicKey = await fetchPublicKey();
    }
    return cachedPublicKey;
}

function verifyWith(publicKey: string, rawBody: string, signature: string) {
    try {
        return createVerify("SHA256")
            .update(rawBody, "utf8")
            .verify(publicKey, signature, "base64");
    } catch {
        // Malformed signature or key — "not verified", not a crash.
        return false;
    }
}

/**
 * Verifies a webhook against the merchant public key.
 *
 * `rawBody` must be the exact bytes monobank sent: re-serialising the parsed
 * JSON changes key order and whitespace, and the signature would never match.
 */
export async function verifyWebhookSignature(
    rawBody: string,
    signature: string | null
): Promise<boolean> {
    if (!signature) return false;

    if (verifyWith(await getPublicKey(), rawBody, signature)) {
        return true;
    }

    // Possible key rotation: refetch once and retry before rejecting.
    return verifyWith(await getPublicKey(true), rawBody, signature);
}
