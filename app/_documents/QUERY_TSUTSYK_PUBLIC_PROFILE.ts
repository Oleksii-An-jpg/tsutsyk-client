import {gql} from "@apollo/client";
import {TSUTSYK_PUBLIC_PROFILE_FRAGMENT} from "@/app/_documents/fragments/TSUTSYK_PUBLIC_PROFILE_FRAGMENT";

export const QUERY_TSUTSYK_PUBLIC_PROFILE = gql`
  ${TSUTSYK_PUBLIC_PROFILE_FRAGMENT}
  query TsutsykPublicProfile($id: ID!) {
    getTsutsykPublicProfile(id: $id) {
      ...TsutsykPublicProfileFragment
    }
  }
`;
