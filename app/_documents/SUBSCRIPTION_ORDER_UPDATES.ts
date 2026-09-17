import {gql} from "@apollo/client";

// The thin tracking view, not the whole order: the websocket carries no
// bearer token, so the API guards this on knowing the order number and keeps
// contact details behind `getOrder`.
export const SUBSCRIPTION_ORDER_UPDATES = gql`
  subscription OrderUpdates($orderId: ID!) {
    orderUpdates(orderId: $orderId) {
      id
      status
      paymentStatus
      trackingNumber
      updatedAt
    }
  }
`;
