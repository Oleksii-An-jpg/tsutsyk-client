import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_CANCEL_ORDER = gql`
  ${ORDER_FRAGMENT}
  mutation CancelOrder($orderId: ID!, $reason: String) {
    cancelOrder(orderId: $orderId, reason: $reason) {
      ...OrderFragment
    }
  }
`;
