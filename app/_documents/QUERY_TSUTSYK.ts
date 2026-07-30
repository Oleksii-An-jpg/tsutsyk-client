import {gql} from "@apollo/client";
import {TSUTSYK_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_FRAGMENT";

export const QUERY_TSUTSYK = gql`
  ${TSUTSYK_FRAGMENT}
  query Tsutsyk($id: ID!) {
    getTsutsyk(id: $id) {
      ...TsutsykFragment
    }
  }
`;
