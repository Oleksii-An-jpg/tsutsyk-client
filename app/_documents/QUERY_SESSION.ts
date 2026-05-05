import {gql} from "@apollo/client";
import {SESSION_FRAGMENT} from "@/app/_documents/fragments/SESSION_FRAGMENT";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const QUERY_SESSION = gql`
  ${SESSION_FRAGMENT}
  ${LOCATION_FRAGMENT}
  query Session($sessionId: String!) {
    getSession(sessionId: $sessionId) {
      ...SessionFragment
      locations {
        ...LocationFragment
      }
    }
  }
`;
