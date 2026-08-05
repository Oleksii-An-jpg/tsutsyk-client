import {gql} from "@apollo/client";

export const TSUTSYK_PUBLIC_PROFILE_FRAGMENT = gql`
  fragment TsutsykPublicProfileFragment on TsutsykPublicProfile {
    id
    claimed
    name
    photoUrl
  }
`;
