#!/usr/bin/env node
/**
 * Creates a sandbox invoice and prints its payment page.
 *
 * Does what the checkout action does, without the browser: with a test token
 * the invoice API returns a hosted payment page that accepts any Luhn-valid
 * card number and fires a genuine, genuinely signed webhook at whatever
 * webHookUrl you give it.
 *
 * Useful for exercising the webhook, its signature verification and the
 * Firestore record on their own, without clicking through the UI each time.
 *
 *   MONOBANK_ACQUIRING_TOKEN=... NEXT_PUBLIC_SITE_URL=https://<tunnel> \
 *     node scripts/sandbox-invoice.mjs --amount 100
 *
 * Then open the printed URL, pay with a test card, and watch the dev server
 * log the webhook. `--status <invoiceId>` reads an invoice back afterwards.
 *
 * Development only — nothing in the app imports this.
 */

const API_BASE = process.env.MONOBANK_API_BASE ?? "https://api.monobank.ua";

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

function requireToken() {
    const token = process.env.MONOBANK_ACQUIRING_TOKEN;
    if (!token) {
        console.error("MONOBANK_ACQUIRING_TOKEN is not set — see .env.example");
        process.exit(1);
    }
    return token;
}

async function call(path, init) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers: { "X-Token": requireToken(), ...init?.headers },
    });
    const body = await response.text();
    if (!response.ok) {
        console.error(`${path} -> ${response.status}\n${body}`);
        process.exit(1);
    }
    return JSON.parse(body);
}

async function showStatus(invoiceId) {
    const status = await call(
        `/api/merchant/invoice/status?invoiceId=${encodeURIComponent(invoiceId)}`
    );
    console.log(JSON.stringify(status, null, 2));
}

async function createInvoice() {
    const merchant = await call("/api/merchant/details");
    const isTest = String(merchant.merchantId).startsWith("test_");

    console.log(`merchant : ${merchant.merchantName} (${merchant.merchantId})`);
    if (!isTest) {
        // A production token here would charge a real card.
        console.log("\n!! This is a PRODUCTION token. A payment here moves real money.");
        console.log("!! Ctrl-C now unless that is what you meant.\n");
    }

    const amount = Number(arg("amount", 100));
    const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

    if (!baseUrl) {
        console.log(
            "\nNEXT_PUBLIC_SITE_URL is not set, so no webHookUrl will be sent and\n" +
                "nothing will call your webhook. Point it at a tunnel to test that path.\n"
        );
    }

    const invoice = await call("/api/merchant/invoice/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            amount,
            ccy: 980,
            merchantPaymInfo: {
                reference: crypto.randomUUID(),
                destination: "Тестове передзамовлення «Цуцик»",
            },
            ...(baseUrl
                ? {
                      webHookUrl: `${baseUrl}/api/monobank/webhook`,
                      redirectUrl: baseUrl,
                  }
                : {}),
            validity: 3600,
        }),
    });

    console.log(`\namount   : ${(amount / 100).toFixed(2)} UAH`);
    console.log(`invoiceId: ${invoice.invoiceId}`);
    console.log(`\nPay here:\n  ${invoice.pageUrl}\n`);
    if (isTest) {
        console.log("Test cards: any Luhn-valid number, any future date, any CVV.");
        console.log("            4242424242424242 works.");
    }
    console.log(`\nRead it back:\n  node scripts/sandbox-invoice.mjs --status ${invoice.invoiceId}`);
}

const statusId = arg("status");
await (statusId ? showStatus(statusId) : createInvoice());
