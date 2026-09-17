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

Buying a Tsutsyk is: sign in, say where it should go, pay. The order is placed
through **tsutsyk-api**, which prices it, opens the monobank invoice and owns
it from then on. This app never talks to monobank, so the merchant token never
reaches this deployment and there is one place that knows what an order costs.

### Flow

1. `PayButton` on the landing page is a link to `/checkout?product=…`.
2. `/checkout` asks for a sign-in, then for the delivery details. Both are
   required: an order we cannot deliver, or whose customer we cannot reach, is
   money we have to give back. The account is not friction checkout invents —
   a Tsutsyk is unusable without one — so this only moves a step the buyer
   takes anyway to where it also settles the address.
3. The form is react-hook-form, like every other form here. On a valid submit
   it invokes the `startCheckout` Server Action through `useActionState` —
   `startTransition(...)`, the way the Next docs invoke an action outside a
   `<form action>` — with a product id, a quantity, the delivery details and
   the buyer's Firebase ID token. Never an amount. The token is read at that
   moment rather than kept in a field, so a page left open does not submit a
   stale one; a Server Action runs on the server, where the Firebase session in
   the tab does not exist.
4. The action calls `placeOrder` on the API and answers with a redirect to
   monobank's payment page. `redirect` is called outside the `try` block: it
   works by throwing, so a catch around it would turn a successful checkout
   into an error message.
5. monobank returns the buyer to `NEXT_PUBLIC_SITE_URL/orders?order=<number>`,
   whether they paid or not, and `/orders` forwards them to that order's page.
   The payment itself is confirmed by the webhook the API receives — arriving
   at this URL proves nothing.

Checkout needs JavaScript, since signing in does.

### Following an order

`/orders` lists what the customer has bought; `/orders/<number>` is one order:
status, what was paid, the delivery details, and everything that has happened
to it. Both live outside the `(private)` layout on purpose — that one gates on
owning a Tsutsyk, and somebody who has just pre-ordered one owns nothing yet.

From there they can pay an invoice that is still open, ask monobank for a new
one after the old expired, re-check the payment, correct the delivery details,
and cancel (refunded through monobank if it was paid). The page also subscribes
to `orderUpdates`, so a payment confirming while they watch updates the page
without a reload.

**The branch field** in `app/_components/delivery-fields/` is a plain text
input for now — that is where the Nova Poshta branch picker goes. It is one
registered set of fields shared by checkout and the order page, and the API
only checks that a branch is filled in, so swapping it is a change in that one
file. The phone field works like the sign-in one: the input holds the part
after `+380`, and `setValueAs` puts the prefix back.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/api.ts` | Server-side GraphQL calls to tsutsyk-api |
| `app/_lib/catalogue.ts` | The catalogue, read from the API |
| `app/_lib/useOrders.ts` | Order queries, mutations and the live-status subscription |
| `app/_actions/checkout.ts` | `startCheckout` Server Action |
| `app/checkout/`, `app/_components/checkout/` | Sign-in, delivery details, pay |
| `app/_components/delivery-fields/` | The delivery fields, shared by checkout and the order page |
| `app/orders/`, `app/_components/orders/` | The customer's orders |
| `app/orders/[id]/`, `app/_components/order/` | One order: status, payment, delivery, history |

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
