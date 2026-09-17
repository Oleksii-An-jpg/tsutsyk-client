import {gql} from "@apollo/client";

// The oblasts a tracker can follow for air raid alerts. Static for the life of
// the tab, so the hook that reads it caches rather than refetching.
export const QUERY_ALERT_REGIONS = gql`
  query AlertRegions {
    getAlertRegions {
      uid
      title
    }
  }
`;
