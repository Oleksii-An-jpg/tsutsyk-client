'use client';

import { FC, ReactNode } from "react";
import {
    AbsoluteCenter,
    Alert,
    Badge,
    Box,
    Button,
    Container,
    HStack,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import Link from "next/link";
import { useReactiveVar } from "@apollo/client/react";
import { me } from "@/app/_lib/me";
import { useAdminAuth } from "@/app/_hooks/useAdminAuth";
import AuthCard from "@/app/_components/auth";
import { ColorModeButton } from "@/components/ui/color-mode";

/**
 * tsutsyk.live/admin — the back office.
 *
 * Outside `(private)` on purpose, and not because it is less guarded: that
 * group gates on owning a Tsutsyk, which is the wrong question here. Whoever
 * packs the parcels need not own a tracker, and a ґазда who owns three is
 * still not one of us.
 *
 * The gate below is the `admin` custom claim, the same one the API's own
 * `AdminGuard` reads off the same token. It is not the authorisation: every
 * query and mutation behind here is checked again server-side, and a browser
 * that lied its way past this layout would get "Not allowed" from all of
 * them. What it buys is that nobody is shown a console whose every button
 * fails, and that the admin-only queries are never sent on behalf of someone
 * they will be refused for.
 */
export default function AdminLayout({ children }: Readonly<{ children: ReactNode }>) {
    useAdminAuth();
    const { checked, authenticated, admin } = useReactiveVar(me);

    // `checked` alone, deliberately — not `authSettled`. That one also waits
    // for getMyTsutsyks, which answers a question this page does not ask: the
    // claim arrives with the token, so by the time Firebase has answered at
    // all, whether this is one of us is already settled.
    if (!checked) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    if (!authenticated) {
        return (
            <Container maxW="md" py={{ base: 8, md: 16 }}>
                <AuthCard
                    title="Панель замовлень"
                    description="Увійдіть акаунтом, якому надано доступ"
                />
            </Container>
        );
    }

    if (!admin) {
        return (
            <Container maxW="2xl" py={{ base: 8, md: 16 }}>
                <Alert.Root status="warning" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Доступу немає</Alert.Title>
                        <Alert.Description>
                            <Stack align="start" gap="3">
                                <Text>
                                    Цей акаунт не має доступу до панелі замовлень. Якщо
                                    доступ щойно надали — вийдіть і увійдіть знову, щоб
                                    отримати новий токен.
                                </Text>
                                <Button asChild size="sm" variant="outline">
                                    <Link href="/">На головну</Link>
                                </Button>
                            </Stack>
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            </Container>
        );
    }

    return (
        <Box bg="bg" minH="100vh">
            <AdminBar />
            {children}
        </Box>
    );
}

const AdminBar: FC = () => (
    <Box
        as="nav"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="bg/85"
        css={{ backdropFilter: "blur(8px)" }}
        borderBottomWidth="1px"
    >
        <Container maxW="6xl" py="3">
            <HStack justify="space-between" gap="3">
                <HStack gap="3">
                    <Button asChild size="sm" variant="ghost" rounded="full">
                        <Link href="/admin">Замовлення</Link>
                    </Button>
                    {/* Says out loud which side of the app this is: the pages
                        behind here look like the customer's own order page on
                        purpose, and mistaking one for the other is how
                        somebody dispatches the wrong parcel. */}
                    <Badge colorPalette="orange" variant="subtle" rounded="full">
                        Панель
                    </Badge>
                </HStack>
                <HStack gap="2">
                    <Button asChild size="sm" variant="ghost" rounded="full">
                        <Link href="/">На сайт</Link>
                    </Button>
                    <ColorModeButton />
                </HStack>
            </HStack>
        </Container>
    </Box>
);
