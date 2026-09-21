import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_MARK_ORDER_DELIVERED = gql`
  ${ORDER_FRAGMENT}
  mutation MarkOrderDelivered($orderId: ID!) {
    markOrderDelivered(orderId: $orderId) {
      ...OrderFragment
    }
  }
`;
