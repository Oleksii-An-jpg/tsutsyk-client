'use client';

import {FC, PropsWithChildren, useEffect, useMemo} from "react";
import {createApolloClient} from "@/app/_lib/apollo";
import {ApolloProvider} from "@apollo/client/react";

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
        {children}
    </ApolloProvider>
}

export default Provider;