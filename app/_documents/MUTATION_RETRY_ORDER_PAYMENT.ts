import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_RETRY_ORDER_PAYMENT = gql`
  ${ORDER_FRAGMENT}
  mutation RetryOrderPayment($orderId: ID!, $redirectUrl: String) {
    retryOrderPayment(orderId: $orderId, redirectUrl: $redirectUrl) {
      invoiceId
      pageUrl
      order {
        ...OrderFragment
      }
    }
  }
`;
