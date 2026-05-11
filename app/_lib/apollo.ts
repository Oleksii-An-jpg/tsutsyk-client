import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloLink,
} from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { ErrorLink } from "@apollo/client/link/error";
import {
    CombinedGraphQLErrors,
    CombinedProtocolErrors,
} from "@apollo/client/errors";
import { createClient } from "graphql-ws";

const HTTP_URL =
    process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL ?? "/graphql";
const WS_URL =
    process.env.NEXT_PUBLIC_GRAPHQL_WS_URL ??
    HTTP_URL.replace(/^http/, "ws");

// ─── Error link ─────────────────────────────────────────────────────────
const errorLink = new ErrorLink(({ error, operation }) => {
    if (CombinedGraphQLErrors.is(error)) {
        error.errors.forEach(({ message, locations, path }) =>
            console.log(
                `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
            )
        );
    } else if (CombinedProtocolErrors.is(error)) {
        error.errors.forEach(({ message, extensions }) =>
            console.log(
                `[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(
                    extensions
                )}`
            )
        );
    } else {
        console.error(`[Network error]: ${error}`);
    }
});

// ─── HTTP link (queries & mutations) ────────────────────────────────────
const httpLink = new HttpLink({ uri: HTTP_URL });

// ─── WebSocket link (subscriptions) — only on client ────────────────────
function makeWsLink() {
    const wsClient = createClient({
        url: WS_URL,
        keepAlive: 10_000,       // ping every 10 s — detects silently dead connections
        retryAttempts: Infinity, // never give up reconnecting
        shouldRetry: () => true,
        on: {
            connected: () => console.log("[WS] Connected"),
            closed: () => console.log("[WS] Closed"),
            error: (err) => console.error("[WS] Error", err),
        },
    });

    return new GraphQLWsLink(wsClient);
}

// ─── Split: subscriptions → WS, everything else → HTTP ──────────────────
function makeLink() {
    if (typeof window === "undefined") {
        // SSR: HTTP only
        return ApolloLink.from([errorLink, httpLink]);
    }

    const wsLink = makeWsLink();

    const splitLink = ApolloLink.split(
        ({ query }) => {
            const def = getMainDefinition(query);
            return (
                def.kind === "OperationDefinition" &&
                def.operation === "subscription"
            );
        },
        wsLink,
        httpLink
    );

    return ApolloLink.from([errorLink, splitLink]);
}

// ─── Cache ───────────────────────────────────────────────────────────────
const cache = new InMemoryCache();

export function createApolloClient() {
    return new ApolloClient({
        link: makeLink(),
        cache,
        defaultOptions: {
            watchQuery: {fetchPolicy: "cache-and-network"},
        },
    })
}