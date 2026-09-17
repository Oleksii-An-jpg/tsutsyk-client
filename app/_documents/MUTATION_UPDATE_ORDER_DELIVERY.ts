import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_UPDATE_ORDER_DELIVERY = gql`
  ${ORDER_FRAGMENT}
  mutation UpdateOrderDelivery($orderId: ID!, $input: DeliveryInput!) {
    updateOrderDelivery(orderId: $orderId, input: $input) {
      ...OrderFragment
    }
  }
`;
