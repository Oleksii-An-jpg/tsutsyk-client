import {gql} from "@apollo/client";
import {ALERT_AREA_FRAGMENT} from "@/app/_documents/fragments/ALERT_AREA_FRAGMENT";

export const QUERY_ALERT_AREAS = gql`
  ${ALERT_AREA_FRAGMENT}
  query AlertAreas($tsutsykId: ID!) {
    getAlertAreas(tsutsykId: $tsutsykId) {
      ...AlertAreaFragment
    }
  }
`;
