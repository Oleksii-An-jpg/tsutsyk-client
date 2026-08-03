import {gql} from "@apollo/client";
import {TSUTSYK_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_FRAGMENT";

export const MUTATION_CLAIM_GADGET = gql`
  ${TSUTSYK_FRAGMENT}
  mutation ClaimGadget($id: ID!) {
    claimGadget(id: $id) {
      ...TsutsykFragment
    }
  }
`;
