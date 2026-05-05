import {gql} from "@apollo/client";

export const LOCATION_FRAGMENT = gql`
  fragment LocationFragment on Location {
    id
    latitude
    longitude
    timestamp
    sessionId
    battery
  }
`;
