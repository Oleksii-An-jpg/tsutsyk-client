import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const QUERY_ORDER = gql`
  ${ORDER_FRAGMENT}
  query Order($id: ID!) {
    getOrder(id: $id) {
      ...OrderFragment
    }
  }
`;
