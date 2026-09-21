import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_MARK_ORDER_SHIPPED = gql`
  ${ORDER_FRAGMENT}
  mutation MarkOrderShipped($orderId: ID!, $trackingNumber: String!) {
    markOrderShipped(orderId: $orderId, trackingNumber: $trackingNumber) {
      ...OrderFragment
    }
  }
`;
