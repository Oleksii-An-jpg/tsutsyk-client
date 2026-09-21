import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const MUTATION_MARK_ORDER_IN_ASSEMBLY = gql`
  ${ORDER_FRAGMENT}
  mutation MarkOrderInAssembly($orderId: ID!) {
    markOrderInAssembly(orderId: $orderId) {
      ...OrderFragment
    }
  }
`;
