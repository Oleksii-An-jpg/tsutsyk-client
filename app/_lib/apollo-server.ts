/**
 * The same GraphQL API as the browser talks to, from the server: Server
 * Actions and Server Components.
 *
 * It is a second client rather than a reuse of `app/_lib/apollo.ts` because
 * that one is the browser's in three ways that do not survive the trip:
 * it reads the caller's token off the Firebase client SDK (`auth.currentUser`,
 * which is always null here), it may be pointed at a relative "/graphql",
 * which the server cannot resolve, and it opens a websocket for
 * subscriptions, which no request-scoped call wants. Here the token arrives
 * as an argument, and the endpoint has to be absolute.
 *
 * What the two do share is the part worth sharing: the operations in
 * `app/_documents` and the types codegen writes for them, so an operation is
 * spelled out once whichever side ends up sending it.
 *
 * Every call runs `no-cache`. A normalised cache pays for itself when a
 * component tree re-reads it, and there is no tree here; worse, one client on
 * a server is shared by every request in flight, so anything it kept for one
 * buyer could be read back for the next. Nothing is kept, which is what makes
 * the single client below safe to hold onto. The caching we do want — the
 * catalogue — is Next's, on the `fetch` underneath.
 *
 * Server-side only: a bearer token passes through these calls, so nothing
 * here may be imported from a Client Component.
 */

import {
    ApolloClient,
    HttpLink,
    InMemoryCache,
    type DocumentNode,
    type OperationVariables,
} from "@apollo/client";

let client: ApolloClient | undefined;

/**
 * The server's client. Built on first use so a missing endpoint is reported
 * when something actually tries to call the API, rather than while the module
 * is being imported.
 */
export function getServerClient(): ApolloClient {
    if (!process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL) {
        throw new Error(
            "NEXT_PUBLIC_GRAPHQL_HTTP_URL is not set to an absolute URL — see .env.example"
        );
    }

    return (client ??= new ApolloClient({
        link: new HttpLink({uri: process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL}),
        cache: new InMemoryCache(),
        defaultOptions: {
            query: {fetchPolicy: "no-cache"},
            mutate: {fetchPolicy: "no-cache"},
        },
    }));
}

export type ServerCallOptions = {
    /** The caller's Firebase ID token, when there is a signed-in caller. */
    idToken?: string | null;
    /** Seconds to cache for. Omitted, the call is never cached. */
    revalidate?: number;
};

/**
 * Per-operation context: who is asking, and what Next may do with the
 * response. Both ride along on the `fetch` the link makes.
 */
function contextFor({idToken, revalidate}: ServerCallOptions) {
    return {
        ...(idToken ? {headers: {Authorization: `Bearer ${idToken}`}} : {}),
        // A personalised or state-changing call is never cacheable, and only
        // the catalogue asks to be cached.
        fetchOptions:
            revalidate !== undefined && !idToken
                ? {next: {revalidate}}
                : {cache: "no-store" as const},
    };
}

/**
 * Both helpers hand back `data` and let everything else throw: under Apollo's
 * default error policy a GraphQL error comes back as `CombinedGraphQLErrors`
 * and a failed request as `ServerError`, either of which says more than a
 * null would. Callers that can carry on without the answer catch it.
 *
 * The cast on the options is Apollo's `VariablesOption`, which makes
 * `variables` required or optional depending on the operation. It cannot
 * decide that against a type parameter this function has not been called with
 * yet, so it is settled here and checked where it matters — at the call site,
 * against the variables codegen wrote for that document.
 */
export async function serverQuery<
    TData,
    TVariables extends OperationVariables = OperationVariables,
>(
    query: DocumentNode,
    variables?: TVariables,
    options: ServerCallOptions = {}
): Promise<TData> {
    const {data} = await getServerClient().query<TData, TVariables>({
        query,
        variables,
        context: contextFor(options),
    } as ApolloClient.QueryOptions<TData, TVariables>);

    if (!data) throw new Error("the API answered without data");
    return data;
}

export async function serverMutate<
    TData,
    TVariables extends OperationVariables = OperationVariables,
>(
    mutation: DocumentNode,
    variables?: TVariables,
    options: ServerCallOptions = {}
): Promise<TData> {
    const {data} = await getServerClient().mutate<TData, TVariables>({
        mutation,
        variables,
        context: contextFor(options),
    } as ApolloClient.MutateOptions<TData, TVariables>);

    if (!data) throw new Error("the API answered without data");
    return data;
}
