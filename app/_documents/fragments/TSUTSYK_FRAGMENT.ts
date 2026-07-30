import {gql} from "@apollo/client";

export const TSUTSYK_FRAGMENT = gql`
  fragment TsutsykFragment on Tsutsyk {
    id
    photoUrl
    alertDistanceMeters
  }
`;
