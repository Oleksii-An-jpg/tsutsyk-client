import {gql} from "@apollo/client";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const SUBSCRIPTION_LOCATION_UPDATES = gql`
  ${LOCATION_FRAGMENT}
  subscription LocationUpdates($sessionId: ID!) {
    locationUpdates(sessionId: $sessionId) {
      ...LocationFragment
    }
  }
`;
