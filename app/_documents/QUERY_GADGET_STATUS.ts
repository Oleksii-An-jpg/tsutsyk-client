import {gql} from "@apollo/client";

export const QUERY_GADGET_STATUS = gql`
  query GadgetStatus($id: ID!) {
    getGadgetStatus(id: $id) {
      id
      claimed
    }
  }
`;
