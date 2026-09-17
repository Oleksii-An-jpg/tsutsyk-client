import {gql} from "@apollo/client";

export const TSUTSYK_FRAGMENT = gql`
  fragment TsutsykFragment on Tsutsyk {
    id
    name
    photoUrl
    claimed
    alertDistanceMeters
    alertRegion {
      uid
      title
    }
    airRaidStatus
  }
`;
