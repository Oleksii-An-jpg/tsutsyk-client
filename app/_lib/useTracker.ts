"use client";
import { useQuery, useMutation, useSubscription } from "@apollo/client/react";
import { useState, useMemo } from "react";
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
import {
    LocationUpdatesSubscription,
    LocationUpdatesSubscriptionVariables
} from "@/app/_documents/__generated__/SUBSCRIPTION_LOCATION_UPDATES.codegen";
import {QUERY_TSUTSYK} from "@/app/_documents/QUERY_TSUTSYK";
import {
    TsutsykQuery,
    TsutsykQueryVariables
} from "@/app/_documents/__generated__/QUERY_TSUTSYK.codegen";
import {MUTATION_UPDATE_TSUTSYK} from "@/app/_documents/MUTATION_UPDATE_TSUTSYK";
import {
    UpdateTsutsykMutation,
    UpdateTsutsykMutationVariables
} from "@/app/_documents/__generated__/MUTATION_UPDATE_TSUTSYK.codegen";
import {QUERY_TSUTSYK_PUBLIC_PROFILE} from "@/app/_documents/QUERY_TSUTSYK_PUBLIC_PROFILE";
import {
    TsutsykPublicProfileQuery,
    TsutsykPublicProfileQueryVariables
} from "@/app/_documents/__generated__/QUERY_TSUTSYK_PUBLIC_PROFILE.codegen";
import {QUERY_ALERT_REGIONS} from "@/app/_documents/QUERY_ALERT_REGIONS";
import {
    AlertRegionsQuery,
    AlertRegionsQueryVariables
} from "@/app/_documents/__generated__/QUERY_ALERT_REGIONS.codegen";
import {QUERY_MY_TSUTSYKS} from "@/app/_documents/QUERY_MY_TSUTSYKS";
import {
    MyTsutsyksQuery,
    MyTsutsyksQueryVariables
} from "@/app/_documents/__generated__/QUERY_MY_TSUTSYKS.codegen";
import {MUTATION_CLAIM_TSUTSYK} from "@/app/_documents/MUTATION_CLAIM_TSUTSYK";
import {
    ClaimTsutsykMutation,
    ClaimTsutsykMutationVariables
} from "@/app/_documents/__generated__/MUTATION_CLAIM_TSUTSYK.codegen";
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
            pollInterval: 30_000,
        }
    );

    const sessionId = result.data?.getActiveSession?.id;

    useSubscription<LocationUpdatesSubscription, LocationUpdatesSubscriptionVariables>(
        SUBSCRIPTION_LOCATION_UPDATES,
        {
            variables: { sessionId: sessionId ?? '' },
            skip: !sessionId,
        }
    );

    return result;
}

export function useTsutsyk(tsutsykId: string) {
    return useQuery<TsutsykQuery, TsutsykQueryVariables>(
        QUERY_TSUTSYK,
        {
            variables: { id: tsutsykId },
            skip: !tsutsykId,
            // `airRaidStatus` rides along on this query and is the one field
            // here that changes on its own. A minute is well inside the
            // server's own staleness window, so the badge cannot sit on a
            // reading the API has already stopped vouching for.
            pollInterval: 60_000,
        }
    );
}

// The 27 oblasts, for the region picker. Static, so it is answered from cache
// after the first fetch rather than refetched with every drawer open.
export function useAlertRegions() {
    return useQuery<AlertRegionsQuery, AlertRegionsQueryVariables>(
        QUERY_ALERT_REGIONS,
        { fetchPolicy: 'cache-first' }
    );
}

export function useTsutsykHistory(sessionId: string) {
    return useQuery<TsutsykHistoryQuery, TsutsykHistoryQueryVariables>(
        QUERY_TSUTSYK_HISTORY,
        { variables: { sessionId }, skip: !sessionId }
    );
}

// Public, unauthenticated lookup for the tsutsyk.live/tsutsyk/<id> landing page.
export function useTsutsykPublicProfile(id: string) {
    return useQuery<TsutsykPublicProfileQuery, TsutsykPublicProfileQueryVariables>(
        QUERY_TSUTSYK_PUBLIC_PROFILE,
        { variables: { id }, skip: !id }
    );
}

export function useMyTsutsyks(opts?: { skip?: boolean }) {
    return useQuery<MyTsutsyksQuery, MyTsutsyksQueryVariables>(
        QUERY_MY_TSUTSYKS,
        { skip: opts?.skip }
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

export function useUpdateTsutsyk() {
    return useMutation<UpdateTsutsykMutation, UpdateTsutsykMutationVariables>(MUTATION_UPDATE_TSUTSYK);
}

export function useClaimTsutsyk() {
    return useMutation<ClaimTsutsykMutation, ClaimTsutsykMutationVariables>(MUTATION_CLAIM_TSUTSYK, {
        refetchQueries: [QUERY_MY_TSUTSYKS],
    });
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

    // When history is refetched (e.g. on visibilitychange) it may now include
    // points that livePoints already received via subscription. Appending stale
    // livePoints after the newer history would place the marker at an old
    // position and draw a zigzag trail. Filter by ID (auto-increment) so only
    // genuinely new live points are appended.
    const historyIdSet = useMemo(
        () => new Set(historyPoints.map(p => p.id)),
        [historyPoints]
    );
    const dedupedLivePoints = useMemo(
        () => livePoints.filter(p => !historyIdSet.has(p.id)),
        [livePoints, historyIdSet]
    );

    const trail = [...historyPoints, ...dedupedLivePoints];
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