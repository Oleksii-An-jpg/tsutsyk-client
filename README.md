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

## Payments and orders

The pre-order button places an order through **tsutsyk-api** and hands the
buyer to monobank's hosted payment page, which offers card, Apple Pay, Google
Pay and the monobank app.

This app does not talk to monobank. The merchant token, the invoice, the
webhook and the order itself all live in the API, so the token never reaches
this deployment and there is one place that knows what an order costs.

### Flow

1. `PayButton` is a form posting to the `startCheckout` Server Action, carrying
   a product id and a quantity — never an amount. A signed-in buyer's Firebase
   ID token rides along in a hidden field, because a Server Action runs on the
   server where the session in this tab does not exist.
2. The action calls `placeOrder` on the API. The API prices the basket from its
   own catalogue, writes the order, and opens the monobank invoice.
3. It answers with a redirect to monobank's payment page. Because that is a
   real form submission answered with a 303, checkout works with JavaScript
   disabled. `redirect` is called outside the `try` block: it works by
   throwing, so a catch around it would turn a successful checkout into an
   error message.
4. monobank returns the buyer to `NEXT_PUBLIC_SITE_URL/orders?order=<number>`,
   whether they paid or not, and `/orders` forwards them to that order's own
   page. The payment itself is confirmed by the webhook the API receives —
   arriving at this URL proves nothing.

### Following an order

`/orders` lists what the customer has bought; `/orders/<number>` is one order:
status, what was paid, the delivery details, and everything that has happened
to it. Both live outside the `(private)` layout on purpose — that one gates on
owning a Tsutsyk, and somebody who has just pre-ordered one owns nothing yet.

An order placed while signed in is already attached to the account. One placed
as a guest is claimed on that page, with its number — a button, not something
that happens quietly on sign-in, since the number arrives from a URL and the
account it binds to is the customer's to choose.

From there they can pay an invoice that is still open, ask monobank for a new
one after the old expired, re-check the payment, fill in or correct the
delivery details, and cancel (refunded through monobank if it was paid). The
page also subscribes to `orderUpdates`, so a payment confirming while they
watch updates the page without a reload.

**Delivery** is asked for after payment: these are pre-orders assembled by
hand over weeks, and a form standing between somebody and the pay button costs
sales. The branch field in `delivery-form.tsx` is a plain text input for now —
that is where the Nova Poshta branch picker goes, and the API only checks that
a branch is filled in, so swapping it is a change in that one component.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/api.ts` | Server-side GraphQL calls to tsutsyk-api |
| `app/_lib/catalogue.ts` | The catalogue, read from the API |
| `app/_lib/useOrders.ts` | Order queries, mutations and the live-status subscription |
| `app/_actions/checkout.ts` | `startCheckout` Server Action |
| `app/_components/pay-button/` | The button |
| `app/orders/`, `app/_components/orders/` | The customer's orders |
| `app/orders/[id]/`, `app/_components/order/` | One order: status, payment, delivery, history |
| `app/_components/order-notice/` | Catches an older return link on the landing page |

### Setup

Point `API_GRAPHQL_URL` at the API and set `NEXT_PUBLIC_SITE_URL` to this
deployment's public origin. That is the whole configuration — see
`.env.example`. Acquiring credentials belong in the API.

### Testing locally

Run the API with a monobank **test** token (`GET /api/merchant/details` tells
you: a `test_`-prefixed `merchantId` is the sandbox) and point
`API_GRAPHQL_URL` at it. The sandbox payment page accepts any Luhn-valid card
number — `4242424242424242`, any future date, any CVV — so you can drive a real
payment and a real signed webhook without money.

monobank cannot POST to `localhost`, so the **API** is the one that needs to be
reachable from the internet; see its README for the tunnel. This app only needs
to reach the API.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
