import {gql} from "@apollo/client";
import {TSUTSYK_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_FRAGMENT";

export const QUERY_MY_TSUTSYKS = gql`
  ${TSUTSYK_FRAGMENT}
  query MyTsutsyks {
    getMyTsutsyks {
      ...TsutsykFragment
    }
  }
`;
