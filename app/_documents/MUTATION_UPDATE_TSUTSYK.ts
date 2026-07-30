import {gql} from "@apollo/client";
import {TSUTSYK_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_FRAGMENT";

export const MUTATION_UPDATE_TSUTSYK = gql`
  ${TSUTSYK_FRAGMENT}
  mutation UpdateTsutsyk($id: ID!, $photoUrl: String, $alertDistanceMeters: Int) {
    updateTsutsyk(id: $id, photoUrl: $photoUrl, alertDistanceMeters: $alertDistanceMeters) {
      ...TsutsykFragment
    }
  }
`;
