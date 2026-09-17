"use client";

import { useMutation, useQuery, useSubscription } from "@apollo/client/react";
import { QUERY_MY_ORDERS } from "@/app/_documents/QUERY_MY_ORDERS";
import {
    MyOrdersQuery,
    MyOrdersQueryVariables,
} from "@/app/_documents/__generated__/QUERY_MY_ORDERS.codegen";
import { QUERY_ORDER } from "@/app/_documents/QUERY_ORDER";
import {
    OrderQuery,
    OrderQueryVariables,
} from "@/app/_documents/__generated__/QUERY_ORDER.codegen";
import { MUTATION_CLAIM_ORDER } from "@/app/_documents/MUTATION_CLAIM_ORDER";
import {
    ClaimOrderMutation,
    ClaimOrderMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_CLAIM_ORDER.codegen";
import { MUTATION_UPDATE_ORDER_DELIVERY } from "@/app/_documents/MUTATION_UPDATE_ORDER_DELIVERY";
import {
    UpdateOrderDeliveryMutation,
    UpdateOrderDeliveryMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_UPDATE_ORDER_DELIVERY.codegen";
import { MUTATION_CANCEL_ORDER } from "@/app/_documents/MUTATION_CANCEL_ORDER";
import {
    CancelOrderMutation,
    CancelOrderMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_CANCEL_ORDER.codegen";
import { MUTATION_RETRY_ORDER_PAYMENT } from "@/app/_documents/MUTATION_RETRY_ORDER_PAYMENT";
import {
    RetryOrderPaymentMutation,
    RetryOrderPaymentMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_RETRY_ORDER_PAYMENT.codegen";
import { MUTATION_REFRESH_ORDER_PAYMENT } from "@/app/_documents/MUTATION_REFRESH_ORDER_PAYMENT";
import {
    RefreshOrderPaymentMutation,
    RefreshOrderPaymentMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_REFRESH_ORDER_PAYMENT.codegen";
import { SUBSCRIPTION_ORDER_UPDATES } from "@/app/_documents/SUBSCRIPTION_ORDER_UPDATES";
import {
    OrderUpdatesSubscription,
    OrderUpdatesSubscriptionVariables,
} from "@/app/_documents/__generated__/SUBSCRIPTION_ORDER_UPDATES.codegen";

// ─── Queries ──────────────────────────────────────────────────────────────

export function useMyOrders({ skip }: { skip?: boolean } = {}) {
    return useQuery<MyOrdersQuery, MyOrdersQueryVariables>(QUERY_MY_ORDERS, {
        skip,
    });
}

/**
 * One order, for its owner.
 *
 * `errorPolicy: 'all'` because a perfectly ordinary case answers with an
 * error: an order paid for as a guest is nobody's until it is claimed, and
 * the page turns that into the claim step rather than a red box.
 */
export function useOrder(id: string, { skip }: { skip?: boolean } = {}) {
    return useQuery<OrderQuery, OrderQueryVariables>(QUERY_ORDER, {
        variables: { id },
        skip: skip || !id,
        errorPolicy: "all",
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────

export function useClaimOrder() {
    return useMutation<ClaimOrderMutation, ClaimOrderMutationVariables>(
        MUTATION_CLAIM_ORDER,
        // The order was not in the customer's list a moment ago, and now it is.
        { refetchQueries: [{ query: QUERY_MY_ORDERS }] }
    );
}

export function useUpdateOrderDelivery() {
    return useMutation<
        UpdateOrderDeliveryMutation,
        UpdateOrderDeliveryMutationVariables
    >(MUTATION_UPDATE_ORDER_DELIVERY);
}

export function useCancelOrder() {
    return useMutation<CancelOrderMutation, CancelOrderMutationVariables>(
        MUTATION_CANCEL_ORDER
    );
}

export function useRetryOrderPayment() {
    return useMutation<
        RetryOrderPaymentMutation,
        RetryOrderPaymentMutationVariables
    >(MUTATION_RETRY_ORDER_PAYMENT);
}

export function useRefreshOrderPayment() {
    return useMutation<
        RefreshOrderPaymentMutation,
        RefreshOrderPaymentMutationVariables
    >(MUTATION_REFRESH_ORDER_PAYMENT);
}

// ─── Subscription ─────────────────────────────────────────────────────────

/**
 * Live status for one order.
 *
 * The payment lands as a webhook on the API, not as an answer to anything the
 * browser asked, so without this the customer would sit on a "waiting for
 * payment" page that is already out of date. The payload is only the tracking
 * view, so `onUpdate` refetches the order itself.
 */
export function useOrderUpdates(orderId: string, onUpdate: () => void) {
    return useSubscription<
        OrderUpdatesSubscription,
        OrderUpdatesSubscriptionVariables
    >(SUBSCRIPTION_ORDER_UPDATES, {
        variables: { orderId },
        skip: !orderId,
        onData: () => onUpdate(),
    });
}
