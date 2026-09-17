import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_REFRESH_ORDER_PAYMENT = gql`
  ${ORDER_FRAGMENT}
  mutation RefreshOrderPayment($orderId: ID!) {
    refreshOrderPayment(orderId: $orderId) {
      ...OrderFragment
    }
  }
`;
