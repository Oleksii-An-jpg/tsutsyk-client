/**
 * Order signing for the monopay button widget.
 *
 * The widget — not us — creates the invoice. Our only job is to sign the order:
 *
 *   payloadBase64 = base64(JSON.stringify(orderData))
 *   signature     = base64(DER(ECDSA-P256(SHA256(JSON.stringify(orderData) + requestId))))
 *
 * Docs: https://monobank.ua/api-docs/acquiring/methods/monopay/docs--js-widget
 *
 * The key is a one-time ECDSA P-256 pair whose public half is imported through
 * `POST /api/merchant/monopay/pubkey-import`, which returns the `keyId` the
 * widget quotes back to monobank. See the README for the openssl commands.
 *
 * This module reads the private key, so it must never reach a Client
 * Component — it is imported only from the `prepareMonopayOrder` action.
 */

import { createSign, randomUUID } from "node:crypto";

/**
 * The order the widget turns into an invoice. The docs put it plainly: the
 * structure is identical to the body of the invoice-create API.
 */
export type OrderData = {
    /** Total in minor units (kopiykas). */
    amount: number;
    /** ISO 4217; 980 is the hryvnia. */
    ccy: number;
    merchantPaymInfo: {
        /** Our own order id. monobank echoes it back on the webhook. */
        reference: string;
        destination: string;
        comment?: string;
        basketOrder?: Array<{
            name: string;
            qty: number;
            /** Line total in minor units. */
            sum: number;
            unit?: string;
            code?: string;
            icon?: string;
        }>;
    };
    redirectUrl?: string;
    successUrl?: string;
    failUrl?: string;
    webHookUrl?: string;
    /** Seconds the invoice stays payable. Default 24h, max 30 days. */
    validity?: number;
};

/** Exactly what `MonoPay.init` needs from the server. */
export type SignedOrder = {
    keyId: string;
    requestId: string;
    payloadBase64: string;
    signature: string;
};

export const UAH = 980;

/**
 * monobank expires a requestId after 10 minutes, so a signed order left
 * sitting on an open tab goes stale. The button re-signs on this interval.
 */
export const REQUEST_ID_TTL_MS = 10 * 60 * 1000;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set — see .env.example`);
    return value;
}

/**
 * Signs one order attempt.
 *
 * `requestId` is fresh per call — it is what makes the operation idempotent on
 * monobank's side and stops a captured payload being replayed — so it must
 * never be derived from the order contents.
 */
export function signOrder(orderData: OrderData): SignedOrder {
    const keyId = requireEnv("MONOPAY_KEY_ID");
    // Stored single-line in the environment, the same way FIREBASE_PRIVATE_KEY
    // is. Node accepts both the SEC1 ("EC PRIVATE KEY") form that monobank's
    // openssl recipe produces and the PKCS#8 ("PRIVATE KEY") form their sample
    // code expects, so either export of private.pem works here.
    const privateKey = requireEnv("MONOPAY_PRIVATE_KEY").replace(/\\n/g, "\n");

    const requestId = randomUUID();

    // Serialise once and reuse: the signature covers this exact string, so a
    // second JSON.stringify risks signing something the payload does not match.
    const json = JSON.stringify(orderData);

    // Node emits DER for ECDSA by default, which is what the widget wants.
    // (monobank's sample signs as ieee-p1363 and converts to DER by hand; both
    // produce the same DER signature.)
    const signature = createSign("SHA256")
        .update(json + requestId, "utf8")
        .sign(privateKey, "base64");

    return {
        keyId,
        requestId,
        payloadBase64: Buffer.from(json, "utf8").toString("base64"),
        signature,
    };
}
