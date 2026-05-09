'use client';
import {me} from "@/app/_lib/me";
import {useReactiveVar} from "@apollo/client/react";

export default function Layout({
                                   children,
                               }: Readonly<{
    children: React.ReactNode;
}>) {
    const {authorised} = useReactiveVar(me);

    if (!authorised) {
        return null;
    }

    return children;
}