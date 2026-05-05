import {gql} from "@apollo/client";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const MUTATION_POST_LOCATION = gql`
  ${LOCATION_FRAGMENT}
  mutation PostLocation(
    $tsutsykId: String!
    $sessionId: String!
    $lat: Float!
    $lng: Float!
    $battery: Int
  ) {
    postLocation(
      tsutsykId: $tsutsykId
      sessionId: $sessionId
      lat: $lat
      lng: $lng
      battery: $battery
    ) {
      ...LocationFragment
    }
  }
`;