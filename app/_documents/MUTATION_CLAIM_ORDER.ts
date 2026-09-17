import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_CLAIM_ORDER = gql`
  ${ORDER_FRAGMENT}
  mutation ClaimOrder($orderId: ID!, $phone: String) {
    claimOrder(orderId: $orderId, phone: $phone) {
      ...OrderFragment
    }
  }
`;
