import {gql} from "@apollo/client";
import {SESSION_FRAGMENT} from "@/app/_documents/fragments/SESSION_FRAGMENT";

export const MUTATION_END_SESSION = gql`
  ${SESSION_FRAGMENT}
  mutation EndSession($sessionId: String!) {
    endSession(sessionId: $sessionId) {
      ...SessionFragment
    }
  }
`;