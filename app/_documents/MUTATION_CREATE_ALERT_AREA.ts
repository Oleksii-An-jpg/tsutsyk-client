import {gql} from "@apollo/client";
import {ALERT_AREA_FRAGMENT} from "@/app/_documents/fragments/ALERT_AREA_FRAGMENT";

export const MUTATION_CREATE_ALERT_AREA = gql`
  ${ALERT_AREA_FRAGMENT}
  mutation CreateAlertArea($tsutsykId: ID!, $name: String!, $points: [LatLngInput!]!) {
    createAlertArea(tsutsykId: $tsutsykId, name: $name, points: $points) {
      ...AlertAreaFragment
    }
  }
`;
