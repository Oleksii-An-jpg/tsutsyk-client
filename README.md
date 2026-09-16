This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## The monopay button

The landing page renders monobank's [monopay button](https://monobank.ua/api-docs/acquiring/methods/monopay/docs--about-button).
The widget creates the invoice, shows the QR on desktop and hands off to the
monobank app on mobile — we only sign the order.

### Flow

1. `MonopayButton` calls the `prepareMonopayOrder` Server Action with a product
   id and a quantity — never an amount.
2. The action prices it from the server-side catalogue and signs it:
   `payloadBase64 = base64(JSON.stringify(orderData))`,
   `signature = sign(JSON.stringify(orderData) + requestId)`.
3. The client passes `{keyId, requestId, payloadBase64, signature}` to
   `MonoPay.init(...)` and mounts the `button` element it returns.
4. The widget takes over from the click onward and calls `onSuccess`.
5. monobank POSTs the real outcome to the `webHookUrl` carried in the signed
   payload.

`requestId` expires after 10 minutes, so the button re-signs on a timer rather
than leaving a dead button on a page someone left open.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/products.ts` | Product catalogue and prices (server-side only) |
| `app/_lib/monopay.ts` | Order signing |
| `app/_actions/monopay.ts` | `prepareMonopayOrder` Server Action |
| `app/_components/monopay-button/` | The button |

### Setup

1. Generate an ECDSA P-256 pair and import the public half — the exact commands
   are in `.env.example`. The import returns a `keyId`.
2. Put the `keyId` in `MONOPAY_KEY_ID` and the private key in
   `MONOPAY_PRIVATE_KEY` (single line, newlines as `\n`).
3. Set `MONOBANK_ACQUIRING_TOKEN` and `NEXT_PUBLIC_SITE_URL`.

**The button cannot be exercised with a sandbox token.** monobank's testing
docs describe a test environment for the REST API, reached by using a token
from api.monobank.ua — but the widget never touches that API. It posts straight
to `pay.monobank.ua`, and the only credential it carries is the `keyId`, which
is bound to whichever merchant imported the key. So the token, the one
environment selector monobank documents, is not in the runtime path at all, and
no sandbox host is documented for the widget.

Import the key with a test token and the button fails at invoice creation with:

```
403 {"errCode":"FORBIDDEN","errInfo":"no client-id"}
```

That is monobank failing to resolve a production client for a key registered
against a test merchant. `GET /api/merchant/details` tells you which you have —
a `test_`-prefixed `merchantId` means the button will not work. It needs a
production merchant token, and the button enabled for that merchant.

Two more things worth knowing:

- monobank's own sample signing code only accepts a PKCS#8
  (`-----BEGIN PRIVATE KEY-----`) key, but the openssl recipe in the same docs
  produces SEC1 (`-----BEGIN EC PRIVATE KEY-----`). We read both, so whichever
  export of `private.pem` you have will work.
- The widget is still in beta, per monobank's docs.

### Testing without the button

The button needs production credentials, but everything behind it does not.
The invoice API works in the sandbox, and its hosted payment page takes test
cards — so you can drive a real payment, and a real signed webhook, with a test
token and no money:

```bash
cloudflared tunnel --url https://localhost:3000
NEXT_PUBLIC_SITE_URL=https://<tunnel-host> npm run dev

# in another shell
MONOBANK_ACQUIRING_TOKEN=... NEXT_PUBLIC_SITE_URL=https://<tunnel-host> \
  npm run sandbox:invoice -- --amount 100
```

Open the printed URL and pay with any Luhn-valid card number (4242424242424242,
any future date, any CVV). monobank then POSTs a genuinely signed webhook to the
tunnel, which exercises the signature verification and the Firestore record —
the parts the button cannot reach yet.

`npm run sandbox:invoice -- --status <invoiceId>` reads an invoice back. The
script refuses to be quiet about a production token, since a payment there is
real.

### Webhook

`POST /api/monobank/webhook` is the only trustworthy signal that a payment
happened — the widget's `onSuccess` runs in the buyer's browser and can be
faked. It verifies the `X-Sign` signature against the merchant public key
(`GET /api/merchant/pubkey`, which is what `MONOBANK_ACQUIRING_TOKEN` is for)
over the raw request body, then records the payment in Firestore under
`payments/<invoiceId>`.

Because our server never creates the invoice, the webhook *creates* the record
rather than updating one. It is idempotent — monobank retries, and a
redelivery rewrites the same values — and deliveries that arrive out of order
cannot walk a settled payment back to an in-flight status.

The callback URL is not configured in the monobank dashboard — it travels
inside the signed payload as `webHookUrl`, built from `NEXT_PUBLIC_SITE_URL`.
Signing it means nobody can point our callbacks somewhere else. monobank cannot
POST to `localhost`, so to exercise it locally, expose the dev server through a
tunnel and point `NEXT_PUBLIC_SITE_URL` at it:

```bash
cloudflared tunnel --url https://localhost:3000
NEXT_PUBLIC_SITE_URL=https://<tunnel-host> npm run dev
```

Fulfilment (confirmation email, assembly queue) is still a TODO in the route.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
