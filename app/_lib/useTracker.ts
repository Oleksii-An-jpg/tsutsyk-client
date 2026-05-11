"use client";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import { Reference } from "@apollo/client";
import { useState } from "react";
import { QUERY_TSUTSYK_SESSIONS }  from "@/app/_documents/QUERY_TSUTSYK_SESSIONS";
import {
    TsutsykSessionsQuery,
    TsutsykSessionsQueryVariables
} from "@/app/_documents/__generated__/QUERY_TSUTSYK_SESSIONS.codegen";
import {QUERY_SESSION} from "@/app/_documents/QUERY_SESSION";
import {SessionQuery, SessionQueryVariables} from "@/app/_documents/__generated__/QUERY_SESSION.codegen";
import {
    ActiveSessionQuery,
    ActiveSessionQueryVariables
} from "@/app/_documents/__generated__/QUERY_ACTIVE_SESSION.codegen";
import {QUERY_ACTIVE_SESSION} from "@/app/_documents/QUERY_ACTIVE_SESSION";
import {
    TsutsykHistoryQuery,
    TsutsykHistoryQueryVariables
} from "@/app/_documents/__generated__/QUERY_TSUTSYK_HISTORY.codegen";
import {QUERY_TSUTSYK_HISTORY} from "@/app/_documents/QUERY_TSUTSYK_HISTORY";
import {MUTATION_START_SESSION} from "@/app/_documents/MUTATION_START_SESSION";
import {
    StartSessionMutation,
    StartSessionMutationVariables
} from "@/app/_documents/__generated__/MUTATION_START_SESSION.codegen";
import {MUTATION_END_SESSION} from "@/app/_documents/MUTATION_END_SESSION";
import {
    EndSessionMutation,
    EndSessionMutationVariables
} from "@/app/_documents/__generated__/MUTATION_END_SESSION.codegen";
import {MUTATION_POST_LOCATION} from "@/app/_documents/MUTATION_POST_LOCATION";
import {
    PostLocationMutation,
    PostLocationMutationVariables
} from "@/app/_documents/__generated__/MUTATION_POST_LOCATION.codegen";
import {SUBSCRIPTION_LOCATION_UPDATES} from "@/app/_documents/SUBSCRIPTION_LOCATION_UPDATES";
import {LOCATION_FRAGMENT} from "@/app/_documents/fragments/LOCATION_FRAGMENT";
import {
    LocationUpdatesSubscription,
    LocationUpdatesSubscriptionVariables
} from "@/app/_documents/__generated__/SUBSCRIPTION_LOCATION_UPDATES.codegen";
import {Location} from "@/app/_documents/__generated__/globalTypes.codegen";

// ─── Queries ──────────────────────────────────────────────────────────────

export function useTsutsykSessions(tsutsykId: string) {
    return useQuery<TsutsykSessionsQuery, TsutsykSessionsQueryVariables>(
        QUERY_TSUTSYK_SESSIONS,
        { variables: { tsutsykId }, skip: !tsutsykId }
    );
}

export function useSession(sessionId: string) {
    return useQuery<SessionQuery, SessionQueryVariables>(
        QUERY_SESSION,
        { variables: { sessionId }, skip: !sessionId }
    );
}

export function useActiveSession(tsutsykId: string) {
    const result = useQuery<ActiveSessionQuery, ActiveSessionQueryVariables>(
        QUERY_ACTIVE_SESSION,
        {
            variables: { tsutsykId },
            skip: !tsutsykId,
            // Poll so the client detects new sessions auto-created by the backend
            pollInterval: 30_000,
        }
    );

    const sessionId = result.data?.getActiveSession?.id;

    useSubscription<LocationUpdatesSubscription, LocationUpdatesSubscriptionVariables>(
        SUBSCRIPTION_LOCATION_UPDATES,
        {
            variables: { sessionId: sessionId ?? '' },
            skip: !sessionId,
            onData: ({ client, data }) => {
                const loc = data.data?.locationUpdates;
                if (!loc || !sessionId) return;

                const locRef = client.cache.writeFragment({
                    data: loc,
                    fragment: LOCATION_FRAGMENT,
                    fragmentName: 'LocationFragment',
                });

                client.cache.modify({
                    id: client.cache.identify({ __typename: 'Session', id: sessionId }),
                    fields: {
                        locationCount: (existing: number) => existing + 1,
                        locations: (existingRefs: Reference[]) => [...existingRefs, locRef],
                    },
                });
            },
        }
    );

    return result;
}

export function useTsutsykHistory(sessionId: string) {
    return useQuery<TsutsykHistoryQuery, TsutsykHistoryQueryVariables>(
        QUERY_TSUTSYK_HISTORY,
        { variables: { sessionId }, skip: !sessionId }
    );
}

// ─── Mutations ────────────────────────────────────────────────────────────

export function useStartSession() {
    return useMutation<StartSessionMutation, StartSessionMutationVariables>(MUTATION_START_SESSION);
}

export function useEndSession() {
    return useMutation<EndSessionMutation, EndSessionMutationVariables>(MUTATION_END_SESSION, {
        refetchQueries: [QUERY_ACTIVE_SESSION, QUERY_TSUTSYK_SESSIONS],
    });
}

export function usePostLocation() {
    return useMutation<PostLocationMutation, PostLocationMutationVariables>(MUTATION_POST_LOCATION);
}

export function useLiveTracking(sessionId: string) {
    const [trackedSessionId, setTrackedSessionId] = useState(sessionId);
    const [livePoints, setLivePoints] = useState<Location[]>([]);

    // Reset live buffer when session changes.
    // This is intentionally called during render (not inside an effect) so the
    // stale points are cleared in the same render cycle as the sessionId change.
    if (trackedSessionId !== sessionId) {
        setTrackedSessionId(sessionId);
        setLivePoints([]);
    }

    const { data: historyData, loading: historyLoading } =
        useTsutsykHistory(sessionId);

    const { error } = useSubscription<LocationUpdatesSubscription, LocationUpdatesSubscriptionVariables>(
        SUBSCRIPTION_LOCATION_UPDATES,
        {
            variables: { sessionId },
            skip: !sessionId,
            onData: ({ data }) => {
                const loc = data.data?.locationUpdates;
                if (loc) setLivePoints((prev) => [...prev, loc]);
            },
        }
    );

    // Derive — never copy server data into state
    const historyPoints = historyData?.getTsutsykHistory ?? [];
    const trail = [...historyPoints, ...livePoints];
    const latestLocation = trail.at(-1) ?? null;

    return { trail, latestLocation, historyLoading, error };
}

export function useTsutsykTracking(tsutsykId: string) {
    const {
        data: activeData,
        loading: activeLoading,
        error: activeError,
    } = useActiveSession(tsutsykId);

    const activeSession = activeData?.getActiveSession ?? null;

    // Only fetch all sessions when there's no active one
    const {
        data: sessionsData,
        loading: sessionsLoading,
        error: sessionsError,
    } = useQuery<TsutsykSessionsQuery, TsutsykSessionsQueryVariables>(
        QUERY_TSUTSYK_SESSIONS,
        { variables: { tsutsykId }, skip: !tsutsykId || !!activeSession }
    );

    // Most recent completed session (sessions are returned oldest-first)
    const latestCompletedSession = sessionsData?.getTsutsykSessions[0] ?? null;

    const session = activeSession ?? latestCompletedSession;
    const sessionId = session?.id ?? "";
    const isLive = !!activeSession;
    const loading = activeLoading || sessionsLoading;
    const error = activeError ?? sessionsError;

    const tracking = useLiveTracking(sessionId);

    return {
        ...tracking,
        session,
        sessionId,
        isLive,
        loading: loading || tracking.historyLoading,
        error: error ?? tracking.error,
    };
}