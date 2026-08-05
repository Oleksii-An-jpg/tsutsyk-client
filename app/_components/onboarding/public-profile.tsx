'use client';

import {FC} from 'react';
import {AbsoluteCenter, Avatar, Heading, VStack} from '@chakra-ui/react';
import {TsutsykPublicProfileFragmentFragment} from '@/app/_documents/fragments/__generated__/TSUTSYK_PUBLIC_PROFILE_FRAGMENT.codegen';

type PublicProfileProps = {
    profile: TsutsykPublicProfileFragmentFragment;
};

// The read-only page every scan after the first lands on — no auth,
// no session/location data, just who this Tsutsyk is.
const PublicProfile: FC<PublicProfileProps> = ({profile}) => {
    return (
        <AbsoluteCenter textAlign="center">
            <VStack gap={4}>
                <Avatar.Root size="2xl" colorPalette="pink">
                    <Avatar.Fallback name={profile.name ?? 'Цуцик'} />
                    {profile.photoUrl && <Avatar.Image src={profile.photoUrl} />}
                </Avatar.Root>
                <Heading size="xl">{profile.name}</Heading>
            </VStack>
        </AbsoluteCenter>
    );
};

export default PublicProfile;
