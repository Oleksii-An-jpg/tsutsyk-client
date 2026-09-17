import {gql} from "@apollo/client";

export const ORDER_FRAGMENT = gql`
  fragment OrderFragment on Order {
    id
    status
    paymentStatus
    amount
    currency
    contactPhone
    contactEmail
    invoiceId
    paymentPageUrl
    failureReason
    cancelReason
    trackingNumber
    editable
    cancellable
    payable
    createdAt
    updatedAt
    paidAt
    items {
      productId
      name
      unitPrice
      quantity
      sum
      unit
    }
    delivery {
      method
      recipientName
      phone
      city
      branch
      address
      comment
    }
    events {
      at
      status
      actor
      note
    }
  }
`;
