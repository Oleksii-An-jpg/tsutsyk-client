import {gql} from "@apollo/client";

export const MUTATION_DELETE_PUSH_SUBSCRIPTION = gql`
  mutation DeletePushSubscription($endpoint: String!) {
    deletePushSubscription(endpoint: $endpoint)
  }
`;
