'use client';

import {FC, useCallback, useState} from 'react';
import {
    CloseButton,
    Drawer,
    IconButton,
    Portal,
    Badge,
    Box,
    Flex,
    Text,
    Stack, HStack, Button,
} from '@chakra-ui/react';
import {BiLogOut, BiMenu, BiStopCircle} from 'react-icons/bi';
import {Session, SessionStatus} from "@/app/_documents/__generated__/globalTypes.codegen";
import {useEndSession, useTsutsykSessions} from "@/app/_lib/useTracker";
import {auth} from "@/app/_lib/firebase";

type SettingsProps = {
    tsutsykId: string;
    activeSessionId?: string;
    onSelectSession: (sessionId: string) => void;
};

function formatStartTime(startTime: string): { date: string; time: string } {
    const d = new Date(startTime);
    const date = d.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return { date, time };
}

function formatDuration(start: string, end?: string | null): string {
    const ms = (end ? new Date(end) : new Date()).getTime() - new Date(start).getTime();
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function formatLastSeen(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
}

const SessionItem: FC<{
    session: Session;
    isSelected: boolean;
    onSelect: () => void;
    stopping: boolean;
    onStopSession: (sessionId: string) => void;
}> = ({ session, isSelected, onSelect, onStopSession, stopping }) => {
    const isActive = session.status === SessionStatus.Active;
    const { date, time } = formatStartTime(session.startTime);
    const lastSeen = session.locations.at(-1)?.timestamp;

    return (
        <Box
            as="button"
            onClick={onSelect}
            w="full"
            textAlign="left"
            px={3}
            py={3}
            borderRadius="lg"
            border="1px solid"
            borderColor={isSelected ? 'blue.500' : 'gray.200'}
            bg={isSelected ? 'blue.50' : 'white'}
            _hover={{ bg: isSelected ? 'blue.50' : 'gray.50', borderColor: isSelected ? 'blue.500' : 'gray.300' }}
            _dark={{
                borderColor: isSelected ? 'blue.400' : 'gray.700',
                bg: isSelected ? 'blue.950' : 'gray.900',
                _hover: { bg: isSelected ? 'blue.950' : 'gray.800' },
            }}
            transition="all 0.15s"
        >
            <Flex align="center" justify="space-between" gap={2}>
                <Stack gap={0.5} flex={1} minW={0}>
                    {/* Date + time */}
                    <Flex align="baseline" gap={1.5}>
                        <Text fontWeight="semibold" fontSize="sm" color={isSelected ? 'blue.700' : 'gray.800'} _dark={{ color: isSelected ? 'blue.300' : 'gray.100' }}>
                            {date}
                        </Text>
                        <Text fontSize="xs" color="gray.500" fontFamily="mono">
                            {time}
                        </Text>
                    </Flex>

                    {/* Stats row */}
                    <Flex align="center" gap={2}>
                        <Text fontSize="xs" color="gray.400">
                            {session.locationCount} pts
                        </Text>
                        <Text fontSize="xs" color="gray.300">·</Text>
                        <Text fontSize="xs" color="gray.400">
                            {formatDuration(session.startTime, session.endTime)}
                        </Text>
                        {lastSeen && (
                            <>
                                <Text fontSize="xs" color="gray.300">·</Text>
                                <Text fontSize="xs" color="gray.400">
                                    last {formatLastSeen(lastSeen)}
                                </Text>
                            </>
                        )}
                    </Flex>
                </Stack>

                <HStack>
                    {/* Status badge */}
                    {isActive ? (
                        <>
                            <Badge colorPalette="green" size="sm" variant="subtle">
                                <Box as="span" w={1.5} h={1.5} borderRadius="full" bg="green.500" display="inline-block" mr={1} style={{ animation: 'pulse 1.5s infinite' }} />
                                Live
                            </Badge>
                            <IconButton disabled={stopping} onClick={() => onStopSession(session.id)} variant="subtle" size="2xs">
                                <BiStopCircle />
                            </IconButton>
                        </>
                    ) : (
                        <Badge colorPalette="gray" size="sm" variant="subtle">
                            Done
                        </Badge>
                    )}
                </HStack>
            </Flex>
        </Box>
    );
};

const Settings: FC<SettingsProps> = ({ tsutsykId, activeSessionId, onSelectSession }) => {
    const { data, loading } = useTsutsykSessions(tsutsykId);
    const [mutate, { loading: stopping }] = useEndSession();
    const [open, setOpen] = useState(false);

    const sessions = data?.getTsutsykSessions ?? [];
    const stopSession = useCallback((sessionId: string) => {
        return mutate({
            variables: {
                sessionId
            }
        })
    }, [mutate])

    return (
        <Drawer.Root open={open} onOpenChange={(e) => setOpen(e.open)} placement="end">
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
                            <Drawer.Title>Sessions</Drawer.Title>
                            <Text fontSize="sm" color="gray.500" fontWeight="normal" mt={0.5}>
                                {tsutsykId}
                            </Text>
                        </Drawer.Header>

                        <Drawer.Body p={3} overflowY="auto">
                            {loading ? (
                                <Stack gap={2}>
                                    {[...Array(4)].map((_, i) => (
                                        <Box key={i} h="64px" borderRadius="lg" bg="gray.100" _dark={{ bg: 'gray.800' }}
                                             style={{ animation: 'pulse 1.5s infinite', animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </Stack>
                            ) : sessions.length === 0 ? (
                                <Flex h="full" align="center" justify="center" color="gray.400" fontSize="sm">
                                    No sessions yet
                                </Flex>
                            ) : (
                                <Stack gap={2}>
                                    {sessions.map((session) => (
                                        <SessionItem
                                            key={session.id}
                                            session={session}
                                            stopping={stopping}
                                            isSelected={session.id === activeSessionId}
                                            onStopSession={stopSession}
                                            onSelect={() => {
                                                onSelectSession(session.id);
                                                setOpen(false);
                                            }}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Drawer.Body>
                        <Drawer.Footer>
                            <Button variant="outline" size="xs" onClick={() => auth.signOut()}>
                                <BiLogOut /> Sign out
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