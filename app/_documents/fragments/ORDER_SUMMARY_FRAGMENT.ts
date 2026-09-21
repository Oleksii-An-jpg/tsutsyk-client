import {gql} from "@apollo/client";

/**
 * As much of an order as a queue row shows.
 *
 * Deliberately not `OrderFragment`: the back office asks for fifty orders at
 * a time, and that one carries every line item, every timeline entry and the
 * full address — a few hundred rows of payload to render a list that shows a
 * number, a status and a town. The detail page asks for the rest.
 *
 * Apollo normalises both onto the same `Order` by its id, so a row and the
 * page behind it stay the same order rather than two copies of one.
 */
export const ORDER_SUMMARY_FRAGMENT = gql`
  fragment OrderSummaryFragment on Order {
    id
    status
    paymentStatus
    amount
    trackingNumber
    createdAt
    paidAt
    delivery {
      recipientName
      city
      branch
    }
  }
`;
