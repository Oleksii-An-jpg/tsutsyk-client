'use client';

import {FC, useState} from 'react';
import {
    CloseButton,
    Drawer,
    HStack,
    IconButton,
    Portal,
    Separator,
    Button,
} from '@chakra-ui/react';
import {BiHome, BiLogOut, BiMenu} from 'react-icons/bi';
import Link from 'next/link';
import {auth} from "@/app/_lib/firebase";
import TsutsykProfile from "@/app/_components/tracker/settings/tsutsyk-profile";
import AlertAreasList from "@/app/_components/tracker/settings/alert-areas";

type SettingsProps = {
    tsutsykId: string;
};

const Settings: FC<SettingsProps> = ({ tsutsykId }) => {
    // Controlled so that starting to draw an area can get the drawer out of
    // the way of the map it is about to be drawn on.
    const [open, setOpen] = useState(false);

    return (
        <Drawer.Root placement="end" open={open} onOpenChange={({ open }) => setOpen(open)}>
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
                            <AlertAreasList tsutsykId={tsutsykId} onStartDrawing={() => setOpen(false)} />
                            <Separator my={3} />
                        </Drawer.Body>
                        {/*
                          * The map fills the window and hides the browser's own chrome, and
                          * an installed PWA opened straight onto /me has no Back to go back
                          * to — so without this the front page is unreachable from the one
                          * screen people spend all their time on. It sits beside the sign-out
                          * because this drawer is already where leaving lives.
                          */}
                        <Drawer.Footer>
                            <HStack w="full" justify="space-between">
                                <Button asChild variant="outline" size="xs">
                                    <Link href="/">
                                        <BiHome /> На головну
                                    </Link>
                                </Button>
                                <Button variant="outline" size="xs" onClick={() => auth.signOut()}>
                                    <BiLogOut /> Вийти
                                </Button>
                            </HStack>
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