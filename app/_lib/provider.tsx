'use client';

import {FC, PropsWithChildren, useMemo} from "react";
import {createApolloClient} from "@/app/_lib/apollo";
import {ApolloProvider} from "@apollo/client/react";

const Provider: FC<PropsWithChildren> = ({ children }) => {
    const client = useMemo(() => {
        return createApolloClient();
    }, []);

    return <ApolloProvider client={client}>
        {children}
    </ApolloProvider>
}

export default Provider;