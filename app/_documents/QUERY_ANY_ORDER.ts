import {gql} from "@apollo/client";
import {ORDER_FRAGMENT} from "@/app/_documents/fragments/ORDER_FRAGMENT";

/**
 * One order, whoever it belongs to — the address to copy onto the waybill.
 * Admin only; `QUERY_ORDER` is the same order read by the person who bought it.
 */
export const QUERY_ANY_ORDER = gql`
  ${ORDER_FRAGMENT}
  query AnyOrder($id: ID!) {
    getAnyOrder(id: $id) {
      ...OrderFragment
    }
  }
`;
