"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { QUERY_ORDERS } from "@/app/_documents/QUERY_ORDERS";
import {
    OrdersQuery,
    OrdersQueryVariables,
} from "@/app/_documents/__generated__/QUERY_ORDERS.codegen";
import { QUERY_ANY_ORDER } from "@/app/_documents/QUERY_ANY_ORDER";
import {
    AnyOrderQuery,
    AnyOrderQueryVariables,
} from "@/app/_documents/__generated__/QUERY_ANY_ORDER.codegen";
import { MUTATION_MARK_ORDER_IN_ASSEMBLY } from "@/app/_documents/MUTATION_MARK_ORDER_IN_ASSEMBLY";
import {
    MarkOrderInAssemblyMutation,
    MarkOrderInAssemblyMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_MARK_ORDER_IN_ASSEMBLY.codegen";
import { MUTATION_MARK_ORDER_SHIPPED } from "@/app/_documents/MUTATION_MARK_ORDER_SHIPPED";
import {
    MarkOrderShippedMutation,
    MarkOrderShippedMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_MARK_ORDER_SHIPPED.codegen";
import { MUTATION_MARK_ORDER_DELIVERED } from "@/app/_documents/MUTATION_MARK_ORDER_DELIVERED";
import {
    MarkOrderDeliveredMutation,
    MarkOrderDeliveredMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_MARK_ORDER_DELIVERED.codegen";
import { MUTATION_CANCEL_ANY_ORDER } from "@/app/_documents/MUTATION_CANCEL_ANY_ORDER";
import {
    CancelAnyOrderMutation,
    CancelAnyOrderMutationVariables,
} from "@/app/_documents/__generated__/MUTATION_CANCEL_ANY_ORDER.codegen";
import { OrderStatus } from "@/app/_documents/__generated__/globalTypes.codegen";

/**
 * The back office's half of `useOrders`.
 *
 * Kept in its own module rather than added to that one because the two are
 * authorised differently and it matters: everything in `useOrders` answers
 * about the caller's own orders, and everything here answers about anybody's,
 * behind the `admin` claim. A customer page importing from here by accident
 * would only ever see "Not allowed", and the split makes that hard to do.
 *
 * Nothing here is the authorisation. The API checks the claim on the token of
 * every call — these hooks only decide what we bother asking for.
 */

/** As many as the queue usefully shows at once. The API caps it at 200. */
const PAGE = 50;

// ─── Queries ──────────────────────────────────────────────────────────────

/**
 * The queue, newest first. `status` narrows it — `PAID` is what is waiting to
 * be put together, which is the list somebody actually works from.
 *
 * `fetchPolicy: 'cache-and-network'` is the client default, and it is the
 * right one here: the list is shared with whoever else is packing, so a
 * cached answer should show immediately and then correct itself.
 */
export function useAdminOrders({
    status,
    limit = PAGE,
    skip,
}: {
    status?: OrderStatus | null;
    limit?: number;
    skip?: boolean;
} = {}) {
    return useQuery<OrdersQuery, OrdersQueryVariables>(QUERY_ORDERS, {
        variables: { status: status ?? null, limit },
        skip,
    });
}

/**
 * One order, whoever it belongs to.
 *
 * `errorPolicy: 'all'` for the same reason `useOrder` has it: a number typed
 * into the address bar that does not exist deserves a "not found" rather than
 * a red box. Here it also covers the claim having lapsed — the API answers
 * `Not allowed`, and the layout has somewhere to say so.
 */
export function useAnyOrder(id: string, { skip }: { skip?: boolean } = {}) {
    return useQuery<AnyOrderQuery, AnyOrderQueryVariables>(QUERY_ANY_ORDER, {
        variables: { id },
        skip: skip || !id,
        errorPolicy: "all",
    });
}

// ─── Mutations ────────────────────────────────────────────────────────────

/**
 * Every one of these moves the order between queues — out of `PAID` and into
 * `IN_ASSEMBLY`, out of that and into `SHIPPED` — so each refetches the list
 * by operation name, whatever status the open queue happens to be filtered to.
 *
 * Refetching rather than editing the cache by hand: the mutation answers with
 * the order itself, which keeps the entity fresh, but a list is a list of
 * which orders match, and only the API knows that. Working that out in the
 * browser would be a second copy of the API's rules, one status enum behind.
 */
const REFETCH_THE_QUEUE = { refetchQueries: ["Orders"] };

export function useMarkOrderInAssembly() {
    return useMutation<
        MarkOrderInAssemblyMutation,
        MarkOrderInAssemblyMutationVariables
    >(MUTATION_MARK_ORDER_IN_ASSEMBLY, REFETCH_THE_QUEUE);
}

export function useMarkOrderShipped() {
    return useMutation<
        MarkOrderShippedMutation,
        MarkOrderShippedMutationVariables
    >(MUTATION_MARK_ORDER_SHIPPED, REFETCH_THE_QUEUE);
}

export function useMarkOrderDelivered() {
    return useMutation<
        MarkOrderDeliveredMutation,
        MarkOrderDeliveredMutationVariables
    >(MUTATION_MARK_ORDER_DELIVERED, REFETCH_THE_QUEUE);
}

export function useCancelAnyOrder() {
    return useMutation<CancelAnyOrderMutation, CancelAnyOrderMutationVariables>(
        MUTATION_CANCEL_ANY_ORDER,
        REFETCH_THE_QUEUE
    );
}
