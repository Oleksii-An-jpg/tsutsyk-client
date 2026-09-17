import {gql} from "@apollo/client";

// The VAPID public key comes from the API rather than from this app's own
// environment: it is one half of the keypair the API signs sends with, and a
// storefront holding a stale copy fails at the push service, per device, with
// nothing in anyone's logs to explain it.
export const QUERY_PUSH_CONFIG = gql`
  query PushConfig {
    getPushConfig {
      publicKey
    }
  }
`;
