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

## Payments (monobank / monopay)

The pre-order button on the landing page opens a [monopay](https://monobank.ua/api-docs/acquiring)
invoice and hands the buyer over to monobank's hosted payment page.

### Flow

1. `MonopayButton` (client) calls the `startCheckout` Server Action with a
   product id and a quantity — never an amount.
2. The action looks the price up in the server-side catalogue, creates an
   invoice via `POST /api/merchant/invoice/create`, records the order in
   Firestore, and returns `pageUrl`.
3. The browser navigates to `pageUrl`. monobank sends the buyer back to
   `/order/<reference>` when they are done.
4. monobank POSTs status changes to `/api/monobank/webhook`, which verifies the
   `X-Sign` signature against the merchant public key before touching anything.
5. `/order/<reference>` reconciles against the status endpoint, because the
   redirect usually arrives before the webhook does.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/monobank.ts` | API client and webhook signature verification |
| `app/_lib/products.ts` | Product catalogue and prices (server-side only) |
| `app/_lib/orders.ts` | Order records in Firestore |
| `app/_actions/checkout.ts` | `startCheckout` Server Action |
| `app/_components/monopay-button/` | The button |
| `app/api/monobank/webhook/route.ts` | Status callbacks |
| `app/order/[reference]/` | Post-payment status page |

### Setup

Copy the payment variables from `.env.example` and fill in
`MONOBANK_ACQUIRING_TOKEN` from the merchant dashboard
(Еквайринг та послуги → API). Start with a **test** token — it issues payable
invoices that move no real money.

monobank cannot POST a webhook to `localhost`, so for local testing expose the
dev server through a tunnel and point `NEXT_PUBLIC_SITE_URL` at it:

```bash
cloudflared tunnel --url https://localhost:3000
NEXT_PUBLIC_SITE_URL=https://<tunnel-host> npm run dev
```

Without a tunnel the button and the redirect still work; only the webhook is
missing, and the order page recovers from that by polling the status endpoint.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
