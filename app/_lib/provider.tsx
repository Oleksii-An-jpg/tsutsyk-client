'use client';

import {FC, PropsWithChildren, useEffect, useMemo} from "react";
import {createApolloClient} from "@/app/_lib/apollo";
import {ApolloProvider} from "@apollo/client/react";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import type React from "react";
import { useState } from "react";

const EmotionRegistry: FC<PropsWithChildren> = ({
                                            children,
                                        }) => {
    const [{ cache, flush }] = useState(() => {
        const cache = createCache({ key: "css" });
        cache.compat = true;
        const prevInsert = cache.insert;
        let inserted: string[] = [];
        cache.insert = (...args) => {
            const serialized = args[1];
            if (cache.inserted[serialized.name] === undefined) {
                inserted.push(serialized.name);
            }
            return prevInsert(...args);
        };
        const flush = () => {
            const prevInserted = inserted;
            inserted = [];
            return prevInserted;
        };
        return { cache, flush };
    });

    useServerInsertedHTML(() => {
        const names = flush();
        if (names.length === 0) return null;
        let styles = "";
        for (const name of names) {
            styles += cache.inserted[name];
        }
        return (
            <style
                key={cache.key}
                data-emotion={`${cache.key} ${names.join(" ")}`}
                // biome-ignore lint/security/noDangerouslySetInnerHtml: Avoid hydration errors
                dangerouslySetInnerHTML={{ __html: styles }}
            />
        );
    });

    return <CacheProvider value={cache}>{children}</CacheProvider>;
}

const Provider: FC<PropsWithChildren> = ({ children }) => {
    const client = useMemo(() => {
        return createApolloClient();
    }, []);

    useEffect(() => {
        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                client.refetchQueries({ include: 'active' });
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [client]);

    return <ApolloProvider client={client}>
        <EmotionRegistry>
            {children}
        </EmotionRegistry>
    </ApolloProvider>
}

export default Provider;