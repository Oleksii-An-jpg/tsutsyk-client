import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

/**
 * Calls off somebody else's order. `MUTATION_CANCEL_ORDER` is the customer
 * doing the same thing to their own — the API records which of the two it was.
 */
export const MUTATION_CANCEL_ANY_ORDER = gql`
  ${ORDER_FRAGMENT}
  mutation CancelAnyOrder($orderId: ID!, $reason: String) {
    cancelAnyOrder(orderId: $orderId, reason: $reason) {
      ...OrderFragment
    }
  }
`;
