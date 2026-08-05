import {gql} from "@apollo/client";
import {TSUTSYK_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_FRAGMENT";

export const MUTATION_CLAIM_TSUTSYK = gql`
  ${TSUTSYK_FRAGMENT}
  mutation ClaimTsutsyk($id: ID!, $name: String!, $photoUrl: String) {
    claimTsutsyk(id: $id, name: $name, photoUrl: $photoUrl) {
      ...TsutsykFragment
    }
  }
`;
