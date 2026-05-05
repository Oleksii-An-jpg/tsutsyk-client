import {gql} from "@apollo/client";
import {SESSION_FRAGMENT} from "@/app/_documents/fragments/SESSION_FRAGMENT";

export const MUTATION_START_SESSION = gql`
  ${SESSION_FRAGMENT}
  mutation StartSession($tsutsykId: String!, $sessionId: String!) {
    startSession(tsutsykId: $tsutsykId, sessionId: $sessionId) {
      ...SessionFragment
    }
  }
`;