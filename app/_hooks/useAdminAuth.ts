'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/app/_lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {useBoolean} from "usehooks-ts";
import {me} from '@/app/_lib/me';
import {useReactiveVar} from "@apollo/client/react";

interface AdminAuthState {
    user: User | null;
    isAdmin: boolean;
}

export function useAdminAuth(): AdminAuthState {
    const [user, setUser] = useState<User | null>(null);
    const { value: isAdmin, setTrue, setFalse, setValue } = useBoolean(false);
    const router = useRouter();
    const self = useReactiveVar(me);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                try {
                    const idTokenResult = await user.getIdTokenResult();
                    const hasAdminRole = idTokenResult.claims.role === 'admin';
                    const tsutsykIds = Array.isArray(idTokenResult.claims.tsutsykIds) ? idTokenResult.claims.tsutsykIds : [];
                    setTrue();
                    me({
                        ...self,
                        tsutsykIds,
                        user,
                        authorised: hasAdminRole,
                        checked: true,
                        authenticated: true,
                    });
                } catch (error) {
                    console.error('Error checking admin role:', error);
                    me({
                        ...self,
                        authorised: false,
                        checked: true,
                        authenticated: false,
                    });
                }
            } else {
                me({
                    ...self,
                    checked: true,
                });
            }
        });

        return () => unsubscribe();
    }, [router, setValue, setFalse, setTrue]);

    return { user, isAdmin };
}