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

## Payments (monobank internet acquiring)

The pre-order button opens a monobank invoice and hands the buyer to monobank's
hosted payment page, which offers card, Apple Pay, Google Pay and the monobank
app.

### Flow

1. `PayButton` is a form posting to the `startCheckout` Server Action, carrying
   a product id and a quantity — never an amount.
2. The action prices it from the server-side catalogue and creates an invoice
   via `POST /api/merchant/invoice/create`.
3. It answers with a redirect to monobank's payment page. Because that is a real
   form submission answered with a 303, checkout works with JavaScript
   disabled. monobank returns the buyer to `redirectUrl` when they are done,
   whether they paid or not.

`redirect` is called outside the `try` block: it works by throwing, so a catch
around it would turn a successful checkout into an error message. Nothing is
revalidated — no state of ours changes here, since the payment record is not
written until the webhook arrives.
4. monobank POSTs status changes to `/api/monobank/webhook`, which verifies the
   `X-Sign` signature before recording anything.

Only `redirectUrl` is used: `successUrl` and `failUrl` have to be enabled by
monobank support and are not available by default.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/products.ts` | Product catalogue and prices (server-side only) |
| `app/_lib/monobank.ts` | Invoice create/status, webhook signature verification |
| `app/_lib/payments.ts` | Payment records in Firestore |
| `app/_actions/checkout.ts` | `startCheckout` Server Action |
| `app/_components/pay-button/` | The button |
| `app/api/monobank/webhook/route.ts` | Status callbacks |

### Setup

Put a merchant token in `MONOBANK_ACQUIRING_TOKEN` and your public origin in
`NEXT_PUBLIC_SITE_URL`. That is the whole configuration.

A **test** token from api.monobank.ua gives you a full sandbox: no terminal, no
approval, and a payment page that accepts any Luhn-valid card number.
`GET /api/merchant/details` tells you which you have — a `test_`-prefixed
`merchantId` is the sandbox.

### Webhook

`POST /api/monobank/webhook` is the only trustworthy signal that a payment
happened. It verifies the `X-Sign` signature against the merchant public key
(`GET /api/merchant/pubkey`) over the raw request body, then records the payment
in Firestore under `payments/<invoiceId>`.

Two things monobank's own docs force:

- **Ordering.** Delivery order is not guaranteed — a `success` can arrive before
  the `processing` that preceded it. The payload with the greater `modifiedDate`
  wins, so that field decides which status is current, not arrival order.
- **`expired` sends no webhook.** It is the one status that never calls back, so
  an abandoned invoice is only observable by polling
  `GET /api/merchant/invoice/status`.

Redeliveries are idempotent, and fulfilment is guarded on the payment actually
advancing so a retry cannot fire it twice.

### Testing locally

The sandbox payment page takes test cards, so you can drive a real payment and
a real signed webhook without money. monobank cannot POST to `localhost`, so
expose the dev server first. With nothing to install:

```bash
ssh -R 80:localhost:3000 nokey@localhost.run    # prints an https URL
```

or `brew install cloudflared && cloudflared tunnel --url http://localhost:3000`.
Tunnel to **http** — `npm run dev` serves a self-signed certificate that tunnels
reject, so use `npx next dev` while testing. `next.config.ts` already allows
these tunnel hosts as dev origins.

The checkout action builds both callback URLs from `NEXT_PUBLIC_SITE_URL`, so
the dev server needs it — start it with the hostname the tunnel printed:

```bash
NEXT_PUBLIC_SITE_URL=https://<tunnel-host> npx next dev
```

Then buy something from the landing page with `4242424242424242`, any future
date, any CVV. monobank POSTs a genuinely signed webhook to the tunnel, which
exercises the signature verification and the Firestore write for real.

Fulfilment (confirmation email, assembly queue) is still a TODO in the route.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
