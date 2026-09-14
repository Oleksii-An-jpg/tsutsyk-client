'use client'

import {useReactiveVar} from "@apollo/client/react";
import {authSettled, me} from "@/app/_lib/me";
import NoTsutsyk from "@/app/_components/no-tsutsyk";

export default function Layout({
                                         children,
                                     }: Readonly<{
    children: React.ReactNode;
}>) {
    const self = useReactiveVar(me);

    if (authSettled(self) && self.authenticated && !self.authorised) {
        return <NoTsutsyk />;
    }

    return children;
}
