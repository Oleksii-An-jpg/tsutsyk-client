import {gql} from "@apollo/client";

export const ALERT_AREA_FRAGMENT = gql`
  fragment AlertAreaFragment on AlertArea {
    id
    tsutsykId
    name
    enabled
    points {
      lat
      lng
    }
  }
`;
