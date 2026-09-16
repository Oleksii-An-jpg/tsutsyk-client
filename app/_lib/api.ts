/**
 * The tsutsyk-api GraphQL endpoint, called from the server.
 *
 * Checkout and the catalogue go through the API rather than talking to
 * monobank (or Firestore) from here: the API owns orders end to end, so
 * prices, invoices and payment callbacks all live in one place instead of
 * being half-implemented on both sides.
 *
 * Server-side only — a bearer token passes through these calls, so nothing
 * here may be imported from a Client Component.
 */

const ENDPOINT = resolveEndpoint();

function resolveEndpoint(): string {
    const configured =
        process.env.API_GRAPHQL_URL ?? process.env.NEXT_PUBLIC_GRAPHQL_HTTP_URL;

    // The browser can live with "/graphql"; the server cannot, and a relative
    // URL here fails at request time with a far less obvious message.
    if (configured?.startsWith("http")) return configured;
    return "";
}

export class ApiError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ApiError";
    }
}

type GraphQLResponse<T> = {
    data?: T;
    errors?: { message: string }[];
};

export async function callApi<T>(
    query: string,
    variables: Record<string, unknown> = {},
    options: {
        /** The caller's Firebase ID token, when there is a signed-in caller. */
        idToken?: string | null;
        /** Seconds to cache for. Omitted, the call is never cached. */
        revalidate?: number;
    } = {}
): Promise<T> {
    if (!ENDPOINT) {
        throw new ApiError(
            "API_GRAPHQL_URL is not set to an absolute URL — see .env.example"
        );
    }

    const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(options.idToken
                ? { Authorization: `Bearer ${options.idToken}` }
                : {}),
        },
        body: JSON.stringify({ query, variables }),
        // A personalised or state-changing call is never cacheable, and only
        // the catalogue asks to be cached.
        ...(options.revalidate !== undefined && !options.idToken
            ? { next: { revalidate: options.revalidate } }
            : { cache: "no-store" as const }),
    });

    if (!response.ok) {
        throw new ApiError(`api ${response.status}: ${await response.text()}`);
    }

    const body = (await response.json()) as GraphQLResponse<T>;

    if (body.errors?.length) {
        throw new ApiError(body.errors.map((e) => e.message).join("; "));
    }

    if (!body.data) {
        throw new ApiError("api answered without data");
    }

    return body.data;
}
