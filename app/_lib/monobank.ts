/**
 * monobank acquiring (monopay) — server-side client.
 *
 * Docs: https://monobank.ua/api-docs/acquiring
 *
 * Everything here needs MONOBANK_ACQUIRING_TOKEN, so this module must never be
 * pulled into a Client Component. It is imported only from the checkout Server
 * Action and the webhook Route Handler.
 */

import { createVerify } from "node:crypto";

const API_BASE = process.env.MONOBANK_API_BASE ?? "https://api.monobank.ua";

/** ISO 4217 code for the hryvnia — the default `ccy` for every invoice. */
export const UAH = 980;

/**
 * Invoice lifecycle. `success` is the only status that means "money received";
 * `hold` means the funds are blocked but not captured (two-stage payments,
 * which we do not use).
 */
export type InvoiceStatus =
    | "created"
    | "processing"
    | "hold"
    | "success"
    | "failure"
    | "reversed"
    | "expired";

/** A status no further webhook can move away from — safe to stop waiting on. */
export function isFinalStatus(status: InvoiceStatus): boolean {
    return (
        status === "success" ||
        status === "failure" ||
        status === "reversed" ||
        status === "expired"
    );
}

export type BasketItem = {
    name: string;
    qty: number;
    /** Line total in minor units (kopiykas), i.e. unit price × qty. */
    sum: number;
    unit?: string;
    code?: string;
    icon?: string;
};

export type CreateInvoiceInput = {
    /** Total in minor units (kopiykas). Must equal the sum of `basketOrder`. */
    amount: number;
    ccy?: number;
    /** Our own order id. monobank echoes it back on every webhook. */
    reference: string;
    destination: string;
    comment?: string;
    basketOrder?: BasketItem[];
    redirectUrl: string;
    webHookUrl?: string;
    /** Seconds the payment page stays open. */
    validity?: number;
};

export type CreatedInvoice = {
    invoiceId: string;
    pageUrl: string;
};

export type InvoiceStatusResponse = {
    invoiceId: string;
    status: InvoiceStatus;
    failureReason?: string;
    amount: number;
    ccy: number;
    reference?: string;
    destination?: string;
    createdDate?: string;
    modifiedDate?: string;
};

export class MonobankError extends Error {
    readonly status: number;
    readonly errCode?: string;

    constructor(message: string, status = 0, errCode?: string) {
        super(message);
        this.name = "MonobankError";
        this.status = status;
        this.errCode = errCode;
    }
}

function requireToken(): string {
    const token = process.env.MONOBANK_ACQUIRING_TOKEN;
    if (!token) {
        throw new MonobankError(
            "MONOBANK_ACQUIRING_TOKEN is not set — see .env.example"
        );
    }
    return token;
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: {
            "X-Token": requireToken(),
            // monobank asks integrations to identify themselves; it shows up in
            // the merchant dashboard and helps their support trace requests.
            "X-Cms": "tsutsyk-live",
            "X-Cms-Version": "1.0.0",
            ...init?.headers,
        },
        // Payment state is never cacheable, and Next.js caches `fetch` by default
        // in some contexts — opt out explicitly rather than rely on the default.
        cache: "no-store",
    });

    const body = await response.text();

    if (!response.ok) {
        // Errors come back as {errCode, errText}; fall back to the raw body when
        // monobank returns an HTML error page (happens on 502s).
        let errText = body;
        let errCode: string | undefined;
        try {
            const parsed = JSON.parse(body) as { errCode?: string; errText?: string };
            errCode = parsed.errCode;
            errText = parsed.errText ?? body;
        } catch {
            // keep the raw body
        }
        throw new MonobankError(
            `monobank ${path} failed: ${response.status} ${errText}`,
            response.status,
            errCode
        );
    }

    return JSON.parse(body) as T;
}

/** Creates an invoice and returns the hosted payment page to send the buyer to. */
export function createInvoice(
    input: CreateInvoiceInput
): Promise<CreatedInvoice> {
    const {
        amount,
        ccy = UAH,
        reference,
        destination,
        comment,
        basketOrder,
        redirectUrl,
        webHookUrl,
        validity,
    } = input;

    return call<CreatedInvoice>("/api/merchant/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            amount,
            ccy,
            merchantPaymInfo: {
                reference,
                destination,
                ...(comment ? { comment } : {}),
                ...(basketOrder ? { basketOrder } : {}),
            },
            redirectUrl,
            ...(webHookUrl ? { webHookUrl } : {}),
            ...(validity ? { validity } : {}),
        }),
    });
}

/**
 * Authoritative status straight from monobank. Used when the buyer lands back
 * on our site before the webhook has arrived — the redirect and the webhook
 * race, and the redirect usually wins.
 */
export function getInvoiceStatus(
    invoiceId: string
): Promise<InvoiceStatusResponse> {
    return call<InvoiceStatusResponse>(
        `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
    );
}

// ─── Webhook signature ───────────────────────────────────────────────────
// monobank signs the raw webhook body with the merchant's private key and sends
// the base64 ECDSA-SHA256 signature in `X-Sign`. The matching public key is
// fetched once and memoised; it only changes when the merchant rotates keys,
// which is why a failed check refetches once before giving up.

let cachedPublicKey: string | null = null;

async function fetchPublicKey(): Promise<string> {
    const { key } = await call<{ key: string }>("/api/merchant/pubkey");
    // The endpoint returns the PEM itself, base64-encoded.
    return Buffer.from(key, "base64").toString("utf8");
}

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
        // Malformed signature or key — treat as "not verified" rather than throw.
        return false;
    }
}

/**
 * Verifies a webhook against the merchant public key.
 *
 * `rawBody` must be the exact bytes monobank sent: re-serialising the parsed
 * JSON changes key order and whitespace and the signature will never match.
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

/** Body monobank POSTs to `webHookUrl` — same shape as the status response. */
export type InvoiceWebhookPayload = InvoiceStatusResponse;
