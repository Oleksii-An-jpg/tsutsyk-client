/**
 * Order signing for the monopay button widget.
 *
 * The widget — not us — creates the invoice. Our only job is to hand it a
 * signed order, per the flow in the monopay docs ("Кнопка monopay"):
 *
 *   payloadBase64 = btoa(JSON.stringify(orderData))
 *   signature     = sign(JSON.stringify(orderData) + requestId)
 *
 * The key is a one-time ECDSA P-256 pair whose public half is imported through
 * `POST /api/merchant/monopay/pubkey-import`; that call returns the `keyId`
 * the widget quotes back to monobank. See the README for the openssl commands.
 *
 * This module reads the private key, so it must never reach a Client
 * Component — it is imported only from the `prepareMonopayOrder` action.
 */

import { createSign, randomUUID } from "node:crypto";

/**
 * The order the widget turns into an invoice.
 *
 * NOTE: these field names come from the sequence diagram in the docs
 * ("POST /prepare-payment (orderId, amount, items…)"). Verify them against the
 * "JavaScript виджет" page before going live — a wrong field name here fails
 * at invoice creation, inside the widget, where it is awkward to debug.
 */
export type OrderData = {
    /** Our own order id, echoed back on the webhook. */
    orderId: string;
    /** Total in minor units (kopiykas). */
    amount: number;
    /** ISO 4217; 980 is the hryvnia. */
    ccy: number;
    items: Array<{
        name: string;
        qty: number;
        /** Line total in minor units. */
        sum: number;
    }>;
};

/** Exactly what `MonoPay.init` needs from the server. */
export type SignedOrder = {
    keyId: string;
    requestId: string;
    payloadBase64: string;
    signature: string;
};

export const UAH = 980;

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`${name} is not set — see .env.example`);
    return value;
}

/**
 * Signs one order attempt.
 *
 * `requestId` is fresh per call: it is what stops a captured payload from being
 * replayed, so it must never be derived from the order contents.
 */
export function signOrder(orderData: OrderData): SignedOrder {
    const keyId = requireEnv("MONOPAY_KEY_ID");
    // Stored single-line in the environment, the same way FIREBASE_PRIVATE_KEY is.
    const privateKey = requireEnv("MONOPAY_PRIVATE_KEY").replace(/\\n/g, "\n");

    const requestId = randomUUID();

    // Serialise once and reuse: the signature covers this exact string, so a
    // second JSON.stringify risks signing something the payload does not match.
    const json = JSON.stringify(orderData);

    const signature = createSign("SHA256")
        .update(json + requestId, "utf8")
        // Node defaults ECDSA signatures to DER. If monobank rejects the
        // signature, the other common convention is `dsaEncoding: "ieee-p1363"`.
        .sign(privateKey, "base64");

    return {
        keyId,
        requestId,
        payloadBase64: Buffer.from(json, "utf8").toString("base64"),
        signature,
    };
}
