import {gql} from "@apollo/client";

export const QUERY_PRODUCTS = gql`
  query Products {
    getProducts {
      id
      name
      description
      price
      unit
      image
      maxQuantity
    }
  }
`;
