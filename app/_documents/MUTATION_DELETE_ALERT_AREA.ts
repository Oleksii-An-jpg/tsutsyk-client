import {gql} from "@apollo/client";

export const MUTATION_DELETE_ALERT_AREA = gql`
  mutation DeleteAlertArea($tsutsykId: ID!, $id: ID!) {
    deleteAlertArea(tsutsykId: $tsutsykId, id: $id)
  }
`;
