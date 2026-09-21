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
    const { value: isAdmin, setFalse, setValue } = useBoolean(false);
    const router = useRouter();

    // A Tsutsyk can be granted access either via the admin-managed
    // tsutsykIds custom claim, or by self-claiming it at /tsutsyk/<id> —
    // recorded as ownerUid on the Tsutsyk doc instead. Both sources are
    // merged below once they're available.
    const { data: myTsutsyksData, loading: loadingMyTsutsyks } = useMyTsutsyks({ skip: !user });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                try {
                    const idTokenResult = await firebaseUser.getIdTokenResult();
                    // `admin`, strictly true: the same claim the API's own
                    // AdminGuard reads off the same token, minted over there
                    // by `npm run grant:admin`. A custom claim is arbitrary
                    // JSON, so a truthy string is not somebody being an admin.
                    const isUserAdmin = idTokenResult.claims.admin === true;
                    setValue(isUserAdmin);
                    setHasAdminRole(isUserAdmin);
                    me({
                        ...me(),
                        user: firebaseUser,
                        admin: isUserAdmin,
                        authorised: isUserAdmin,
                        checked: true,
                        authenticated: true,
                        // An admin is authorised on the claim alone; everyone
                        // else is still pending the getMyTsutsyks round-trip.
                        tsutsyksChecked: isUserAdmin,
                    });
                } catch (error) {
                    console.error('Error checking admin role:', error);
                    setFalse();
                    setHasAdminRole(false);
                    me({
                        ...me(),
                        admin: false,
                        authorised: false,
                        checked: true,
                        authenticated: false,
                        tsutsyksChecked: true,
                    });
                }
            } else {
                setFalse();
                setHasAdminRole(false);
                me({
                    ...me(),
                    user: null,
                    tsutsykIds: [],
                    admin: false,
                    authorised: false,
                    checked: true,
                    authenticated: false,
                    tsutsyksChecked: false,
                });
            }
        });

        return () => unsubscribe();
    }, [router, setValue, setFalse]);

    // Re-merge whenever the owned-Tsutsyk query resolves (or the claims
    // above change), so a freshly self-claimed device grants access without
    // requiring a token refresh.
    useEffect(() => {
        if (!user || loadingMyTsutsyks) return;
        const ownedIds = myTsutsyksData?.getMyTsutsyks?.map((t) => t.id) ?? [];
        const tsutsykIds = Array.from(new Set([...ownedIds]));
        me({
            ...me(),
            tsutsykIds,
            // Owning a Tsutsyk authorises the tracker; it does not make
            // anybody one of us, so `admin` is left where the claim put it.
            authorised: hasAdminRole || tsutsykIds.length > 0,
            tsutsyksChecked: true,
        });
    }, [user, hasAdminRole, myTsutsyksData, loadingMyTsutsyks]);

    return { user, isAdmin };
}
