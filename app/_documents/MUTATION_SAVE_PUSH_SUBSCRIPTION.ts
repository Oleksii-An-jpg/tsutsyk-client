import {gql} from "@apollo/client";

export const MUTATION_SAVE_PUSH_SUBSCRIPTION = gql`
  mutation SavePushSubscription($input: PushSubscriptionInput!) {
    savePushSubscription(input: $input)
  }
`;
