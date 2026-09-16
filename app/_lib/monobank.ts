/**
 * monobank internet acquiring.
 *
 * Creates invoices, reads their status, and verifies webhook signatures.
 *
 * monobank signs the raw webhook body with the merchant key and sends the
 * base64 ECDSA-SHA256 signature in `X-Sign`. The matching public key comes from
 * `GET /api/merchant/pubkey`, which needs the merchant token.
 *
 * Docs: https://monobank.ua/api-docs/acquiring/dev/webhooks/verify
 *
 * Everything here needs the merchant token, so this module must never be pulled
 * into a Client Component — it is imported only from the checkout Server Action
 * and the webhook Route Handler.
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

/** Response of `GET /api/merchant/invoice/status`, and the webhook body. */
export type InvoiceStatusResponse = {
    invoiceId: string;
    status: InvoiceStatus;
    failureReason?: string;
    amount: number;
    ccy: number;
    /** Our own order id, echoed back from `merchantPaymInfo.reference`. */
    reference?: string;
    createdDate?: string;
    /**
     * When monobank last changed this invoice. The docs are explicit that
     * webhooks are not delivered in order — a `success` can arrive before the
     * `processing` that preceded it — and that the payload with the later
     * `modifiedDate` is the current one. This field, not arrival order, decides
     * which status wins.
     */
    modifiedDate?: string;
};

/** The webhook body is identical to the status response. */
export type InvoiceWebhookPayload = InvoiceStatusResponse;

export const UAH = 980;

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

export type BasketItem = {
    name: string;
    qty: number;
    /** Line total in minor units (kopiykas). */
    sum: number;
    unit?: string;
    code?: string;
    icon?: string;
};

export type CreateInvoiceInput = {
    /** Total in minor units (kopiykas). */
    amount: number;
    ccy?: number;
    /** Our own order id. monobank echoes it back on every webhook. */
    reference: string;
    destination: string;
    comment?: string;
    basketOrder?: BasketItem[];
    /** Where the buyer returns after paying, success or failure alike. */
    redirectUrl: string;
    webHookUrl?: string;
    /** Seconds the invoice stays payable. Default 24h, capped at 30 days. */
    validity?: number;
};

export type CreatedInvoice = {
    invoiceId: string;
    pageUrl: string;
    appUrl?: string;
};

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
        // Payment state is never cacheable, and Next caches `fetch` by default
        // in some contexts — opt out rather than rely on the default.
        cache: "no-store",
    });

    const body = await response.text();

    if (!response.ok) {
        // Errors come back as {errCode, errText}; fall back to the raw body when
        // monobank returns an HTML error page, which happens on 502s.
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

/** Creates an invoice and returns the hosted page to send the buyer to. */
export function createInvoice(input: CreateInvoiceInput): Promise<CreatedInvoice> {
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
            // Only redirectUrl: successUrl and failUrl have to be enabled by
            // monobank support and are not available by default.
            redirectUrl,
            ...(webHookUrl ? { webHookUrl } : {}),
            ...(validity ? { validity } : {}),
        }),
    });
}

/**
 * Authoritative status straight from monobank. Also the only way to observe
 * `expired`, which the docs say is the one status that never sends a webhook.
 */
export function getInvoiceStatus(invoiceId: string): Promise<InvoiceStatusResponse> {
    return call<InvoiceStatusResponse>(
        `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
    );
}

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
let fetchedAt = 0;

/**
 * Least time between forced refreshes.
 *
 * The webhook is public and unauthenticated, so anyone can post a bad
 * signature. Refreshing on every failure would let that traffic drive one
 * uncached request to monobank per attempt, and once they rate-limit us
 * `fetchPublicKey` throws and genuine callbacks start failing too. Rotations
 * are rare; waiting a few minutes to notice one is the cheaper trade.
 */
const REFRESH_COOLDOWN_MS = 5 * 60 * 1000;

async function getPublicKey(forceRefresh = false): Promise<string> {
    if (!cachedPublicKey) {
        cachedPublicKey = await fetchPublicKey();
        fetchedAt = Date.now();
    } else if (forceRefresh && Date.now() - fetchedAt >= REFRESH_COOLDOWN_MS) {
        cachedPublicKey = await fetchPublicKey();
        fetchedAt = Date.now();
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
