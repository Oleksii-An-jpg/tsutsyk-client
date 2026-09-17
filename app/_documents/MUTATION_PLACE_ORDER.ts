import {gql} from "@apollo/client";

export const MUTATION_PLACE_ORDER = gql`
  mutation PlaceOrder($input: PlaceOrderInput!) {
    placeOrder(input: $input) {
      pageUrl
      order {
        id
      }
    }
  }
`;
