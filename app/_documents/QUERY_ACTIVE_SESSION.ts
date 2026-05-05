import {gql} from "@apollo/client";
import {SESSION_FRAGMENT} from "@/app/_documents/fragments/SESSION_FRAGMENT";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const QUERY_ACTIVE_SESSION = gql`
  ${SESSION_FRAGMENT}
  ${LOCATION_FRAGMENT}
  query ActiveSession($tsutsykId: String!) {
    getActiveSession(tsutsykId: $tsutsykId) {
      ...SessionFragment
      locations {
        ...LocationFragment
      }
    }
  }
`;