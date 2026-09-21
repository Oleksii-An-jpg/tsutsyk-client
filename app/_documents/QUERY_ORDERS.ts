import {gql} from "@apollo/client";
import {ORDER_SUMMARY_FRAGMENT} from "@/app/_documents/fragments/ORDER_SUMMARY_FRAGMENT";

/**
 * Every customer's orders, newest first. Admin only — the API answers this
 * one off the `admin` claim rather than off who owns what.
 *
 * `status: PAID` is the queue of parcels waiting to be put together.
 */
export const QUERY_ORDERS = gql`
  ${ORDER_SUMMARY_FRAGMENT}
  query Orders($status: OrderStatus, $limit: Int) {
    getOrders(status: $status, limit: $limit) {
      ...OrderSummaryFragment
    }
  }
`;
