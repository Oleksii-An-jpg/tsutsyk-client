import {gql} from "@apollo/client";
import {ALERT_AREA_FRAGMENT} from "@/app/_documents/fragments/ALERT_AREA_FRAGMENT";

export const MUTATION_UPDATE_ALERT_AREA = gql`
  ${ALERT_AREA_FRAGMENT}
  mutation UpdateAlertArea($tsutsykId: ID!, $id: ID!, $name: String, $points: [LatLngInput!], $enabled: Boolean) {
    updateAlertArea(tsutsykId: $tsutsykId, id: $id, name: $name, points: $points, enabled: $enabled) {
      ...AlertAreaFragment
    }
  }
`;
