'use client';

import {FC} from 'react';
import {
    CloseButton,
    Drawer,
    IconButton,
    Portal,
    Separator,
    Button,
} from '@chakra-ui/react';
import {BiLogOut, BiMenu} from 'react-icons/bi';
import {auth} from "@/app/_lib/firebase";
import TsutsykProfile from "@/app/_components/tracker/settings/tsutsyk-profile";

type SettingsProps = {
    tsutsykId: string;
};

const Settings: FC<SettingsProps> = ({ tsutsykId }) => {
    return (
        <Drawer.Root placement="end">
            <Drawer.Trigger asChild>
                <IconButton size="sm" colorPalette="gray" aria-label="Open sessions">
                    <BiMenu />
                </IconButton>
            </Drawer.Trigger>

            <Portal>
                <Drawer.Backdrop />
                <Drawer.Positioner>
                    <Drawer.Content maxW="340px">
                        <Drawer.Header borderBottomWidth="1px">
                            <Drawer.Title>Налаштування</Drawer.Title>
                        </Drawer.Header>

                        <Drawer.Body p={3} overflowY="auto">
                            <TsutsykProfile tsutsykId={tsutsykId} />
                            <Separator my={3} />
                        </Drawer.Body>
                        <Drawer.Footer>
                            <Button variant="outline" size="xs" onClick={() => auth.signOut()}>
                                <BiLogOut /> Вийти
                            </Button>
                        </Drawer.Footer>

                        <Drawer.CloseTrigger asChild>
                            <CloseButton size="sm" position="absolute" top={3} right={3} />
                        </Drawer.CloseTrigger>
                    </Drawer.Content>
                </Drawer.Positioner>
            </Portal>
        </Drawer.Root>
    );
};

export default Settings;