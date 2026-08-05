'use client';

import { useEffect, useState } from 'react';
import { auth } from '@/app/_lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import {useBoolean} from "usehooks-ts";
import {me} from '@/app/_lib/me';
import {useMyTsutsyks} from "@/app/_lib/useTracker";

interface AdminAuthState {
    user: User | null;
    isAdmin: boolean;
}

export function useAdminAuth(): AdminAuthState {
    const [user, setUser] = useState<User | null>(null);
    const [hasAdminRole, setHasAdminRole] = useState(false);
    const [claimTsutsykIds, setClaimTsutsykIds] = useState<string[]>([]);
    const { value: isAdmin, setTrue, setFalse, setValue } = useBoolean(false);
    const router = useRouter();

    // A Tsutsyk can be granted access either via the admin-managed
    // tsutsykIds custom claim, or by self-claiming it at /tsutsyk/<id> —
    // recorded as ownerUid on the Tsutsyk doc instead. Both sources are
    // merged below once they're available.
    const { data: myTsutsyksData } = useMyTsutsyks({ skip: !user });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    const isUserAdmin = idTokenResult.claims.role === 'admin';
                    const tsutsykIds = Array.isArray(idTokenResult.claims.tsutsykIds) ? idTokenResult.claims.tsutsykIds : [];
                    setTrue();
                    setHasAdminRole(isUserAdmin);
                    setClaimTsutsykIds(tsutsykIds);
                    me({
                        ...me(),
                        user: firebaseUser,
                        tsutsykIds,
                        authorised: isUserAdmin || tsutsykIds.length > 0,
                        checked: true,
                        authenticated: true,
                    });
                } catch (error) {
                    console.error('Error checking admin role:', error);
                    me({
                        ...me(),
                        authorised: false,
                        checked: true,
                        authenticated: false,
                    });
                }
            } else {
                setFalse();
                setHasAdminRole(false);
                setClaimTsutsykIds([]);
                me({
                    ...me(),
                    tsutsykIds: [],
                    authorised: false,
                    checked: true,
                });
            }
        });

        return () => unsubscribe();
    }, [router, setValue, setFalse, setTrue]);

    // Re-merge whenever the owned-Tsutsyk query resolves (or the claims
    // above change), so a freshly self-claimed device grants access without
    // requiring a token refresh.
    useEffect(() => {
        if (!user) return;
        const ownedIds = myTsutsyksData?.getMyTsutsyks?.map((t) => t.id) ?? [];
        const tsutsykIds = Array.from(new Set([...claimTsutsykIds, ...ownedIds]));
        me({
            ...me(),
            tsutsykIds,
            authorised: hasAdminRole || tsutsykIds.length > 0,
        });
    }, [user, hasAdminRole, claimTsutsykIds, myTsutsyksData]);

    return { user, isAdmin };
}
