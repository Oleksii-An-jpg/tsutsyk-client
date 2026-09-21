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

**The delivery fields** in `app/_components/delivery-fields/` are one
registered set shared by checkout and the order page. The phone field works
like the sign-in one: the input holds the part after `+380`, and `setValueAs`
puts the prefix back.

**The branch picker** is the oblast/settlement/branch cascade in
`branch-picker.tsx`, searched against Nova Poshta's address directory as the
buyer types. The oblast is only a filter that narrows the settlement search —
settlement names repeat across the country — and it is not part of the order.
What the order stores is what our API takes: `city` and `branch` as the plain
text Nova Poshta itself uses ("Заболотів, Снятинський р-н, Івано-Франківська
область", "Відділення №1: вул. М. Грушевського, 3"), so the refs never leave
the picker. That also means an order opened weeks later still shows what was
chosen; the picker looks the settlement up again in the background so that
correcting the branch does not mean re-picking the city.

Nova Poshta is only ever called from the server —
`app/_lib/novaposhta/` holds the client and `app/_actions/novaposhta.ts` the
three read-only Server Actions the browser reaches it through, so
`NOVAPOSHTA_API_KEY` stays put. Every call is cached by Next, keyed on the
request body: the directory changes a few times a year, and Nova Poshta rate-
limits by key.

### Files

| Path | Role |
| --- | --- |
| `app/_lib/api.ts` | Server-side GraphQL calls to tsutsyk-api |
| `app/_lib/catalogue.ts` | The catalogue, read from the API |
| `app/_lib/useOrders.ts` | Order queries, mutations and the live-status subscription |
| `app/_actions/checkout.ts` | `startCheckout` Server Action |
| `app/checkout/`, `app/_components/checkout/` | Sign-in, delivery details, pay |
| `app/_components/delivery-fields/` | The delivery fields, shared by checkout and the order page |
| `app/_lib/novaposhta/`, `app/_actions/novaposhta.ts` | Nova Poshta's address directory, and the browser's way to it |
| `app/orders/`, `app/_components/orders/` | The customer's orders |
| `app/orders/[id]/`, `app/_components/order/` | One order: status, payment, delivery, history |

### Setup

Point `API_GRAPHQL_URL` at the API and set `NEXT_PUBLIC_SITE_URL` to this
deployment's public origin. `NOVAPOSHTA_API_KEY` is the one other thing this
app needs of its own: without it the branch picker has nothing to search, so
checkout cannot be completed. It is read only on the server. See
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

## Installing the app

The download button in the tracker controls puts Tsutsyk Live on the home
screen. `app/manifest.ts` is what makes that possible at all — name, icons,
`start_url`, `display: standalone` — and `app/_lib/useInstallPrompt.ts` is what
decides whether there is anything to offer.

### Two platforms, two different things to do

Chromium fires `beforeinstallprompt` when it decides the app is installable.
Holding that event back (`preventDefault`) takes its own banner down and hands
us the prompt to fire from a button, at a moment that makes sense — next to the
bell, where somebody has just said they want to hear from this app.

iOS has no such event, and never has. Installing there is the share sheet, and
a page cannot open it — so on iOS the button stops pretending to install and
explains where the sheet is instead. That is not a lesser path: on iOS 16.4+
web push only reaches apps that are **on the home screen**, so for an iPhone
this button is what makes the bell work at all.

Anywhere else — a browser that neither fires the event nor has a home screen —
nothing is rendered. A control that can never do its one job is worse than no
control.

### Why a script in `<head>`

`beforeinstallprompt` fires once per page load, and regularly before React has
hydrated. A listener attached on mount would never hear it, and the button
would sit dead for the life of the page. So the root layout registers one
inline, while the document is still parsing, and parks the event on
`window.__installPrompt` for the hook to read. It is a plain `<script>` rather
than `next/script`: `beforeInteractive` queues inline code behind the framework
bundle, which is the one thing this must not wait for.

The hook reads all of this through `useSyncExternalStore` — the event the
browser handed over, the display mode it is drawing in, the engine it is —
because none of it is React's state to hold. That also means it answers
correctly on the first client render, without copying anything into `useState`
on mount.

### The event is good for exactly one prompt

Firing it twice throws. So after the browser's dialog is answered the event is
dropped either way, and a refusal hides the button rather than leaving it to be
clicked into an error. Chromium mints a fresh one when it is ready to ask
again, so the offer comes back on a later visit instead of nagging on this one.
`appinstalled` covers the other way in — somebody installing from the browser's
own menu, which never touches our button.

## Notifications

The bell in the tracker controls subscribes this browser to Web Push. The
**API** sends them — see its README — and this app's only job is to get the
browser's subscription into its hands.

### Why the API sends

Because the API is the thing that finds out. An air raid alert being raised
and a battery going flat both happen whether or not anyone has this app open,
and a page that is closed cannot notice either.

This used to live here, in a server action holding `let subscription` — one
slot for the whole deployment. It stored the last browser to subscribe, so
with two customers the second one's phone got the first one's notifications;
it was lost on every redeploy; and on more than one instance the subscribe and
the send could land on different ones, where the variable was empty. The
comment in that file said the subscription wanted a database. It has one now,
in the API, keyed by the uid in the caller's verified token.

### The keys

There is no `NEXT_PUBLIC_VAPID_PUBLIC_KEY` here any more. The key is read from
`getPushConfig`, because it is one half of the keypair the API signs sends
with: a copy configured separately here could drift, and a mismatched key
fails at the push service, per device, with nothing in anyone's logs. Without
keys on the API the query answers null and the bell stays disabled.

### What the service worker does

`public/sw.js` shows the notification and handles the tap. It follows the
`url` the API put in the payload rather than a hardcoded origin — which had
been sending every notification on every deployment to production — and reuses
an open tab instead of opening one per tap. Payloads carry a `tag`, so an
all-clear replaces the alert it answers instead of stacking under it.

### The alert distance is still a ring, not a notification

`alertDistanceMeters` is evaluated in `app/_components/tracker/tsutsyk/`, in
the browser, against the ґазда's own position — and only while the map is on
screen, since an unmounted component computes nothing and a closed tab holds
no subscription. It colours the marker red. It no longer sends anything: the
push it used to fire could only reach somebody already looking at the map, and
went to whichever browser had most recently subscribed.

Making that a real notification means moving it into the API, and the API
cannot see the ґазда's phone — so it means anchoring the leash to a place
instead of a person. That is a product decision, not a port, and it is the
obvious next thing.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
