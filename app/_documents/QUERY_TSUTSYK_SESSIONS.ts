import {gql} from "@apollo/client";
import {SESSION_FRAGMENT} from "@/app/_documents/fragments/SESSION_FRAGMENT";

export const QUERY_TSUTSYK_SESSIONS = gql`
  ${SESSION_FRAGMENT}
  query TsutsykSessions($tsutsykId: String!) {
    getTsutsykSessions(tsutsykId: $tsutsykId) {
      ...SessionFragment
    }
  }
`;
