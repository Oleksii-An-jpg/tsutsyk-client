import {gql} from "@apollo/client";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";

export const SESSION_FRAGMENT = gql`
${LOCATION_FRAGMENT}
  fragment SessionFragment on Session {
    id
    tsutsykId
    startTime
    endTime
    locationCount
    status
    locations {
        ...LocationFragment
      }
  }
`;