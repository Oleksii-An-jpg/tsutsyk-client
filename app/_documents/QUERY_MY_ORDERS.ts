import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

export const QUERY_MY_ORDERS = gql`
  ${ORDER_FRAGMENT}
  query MyOrders {
    getMyOrders {
      ...OrderFragment
    }
  }
`;
