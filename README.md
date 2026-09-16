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
   `MonoPay.init(...)` and mounts the button element it returns.
4. The widget takes over from the click onward and calls `onSuccess`.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/products.ts` | Product catalogue and prices (server-side only) |
| `app/_lib/monopay.ts` | Order signing |
| `app/_actions/monopay.ts` | `prepareMonopayOrder` Server Action |
| `app/_components/monopay-button/` | The button |

### Setup

See `.env.example` for the one-time key generation and import. In short:
generate an ECDSA P-256 pair, import the public half through
`POST /api/merchant/monopay/pubkey-import` to get a `keyId`, and keep the
private half in `MONOPAY_PRIVATE_KEY`.

### Still to verify

The saved docs cover the flow but not the widget's JavaScript surface. Before
going live, check these against the "JavaScript виджет" and "Приклади
формування підпису даних замовлення" pages:

- the `orderData` field names in `app/_lib/monopay.ts`
- the widget script URL and its `ui` / callback options
- whether the ECDSA signature should be DER (Node's default) or `ieee-p1363`

### Not included

There is no webhook and no order record. The `onSuccess` callback runs in the
browser and cannot be trusted for fulfilment — add the signed webhook before
shipping anything that actually ships a tracker.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
