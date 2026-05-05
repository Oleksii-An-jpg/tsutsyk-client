import {gql} from "@apollo/client";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const QUERY_TSUTSYK_HISTORY = gql`
  ${LOCATION_FRAGMENT}
  query TsutsykHistory($sessionId: ID!) {
    getTsutsykHistory(sessionId: $sessionId) {
      ...LocationFragment
    }
  }
`;