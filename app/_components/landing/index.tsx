'use client';

import {FC, ReactNode} from "react";
import {BiSolidBatteryCharging} from "react-icons/bi";
import {
    Avatar,
    Badge,
    Box,
    Button,
    Card,
    Container,
    Float,
    HStack,
    Heading,
    Icon,
    SimpleGrid,
    Status,
    Text,
    Timeline,
    VStack,
} from "@chakra-ui/react";
import {
    LuArrowRight,
    LuBellRing,
    LuMapPinned,
    LuPawPrint,
    LuRadioTower,
    LuSiren,
} from "react-icons/lu";
import Link from "next/link";
import {ColorModeButton} from "@/components/ui/color-mode";
import PayButton from "@/app/_components/pay-button";

const CONTENT_WIDTH = "3xl";

export type LandingProps = {
    productId: string;
    /**
     * Formatted on the server — the price catalogue never reaches the browser.
     * Null when the API could not be reached: better an unpriced shop window
     * than an error page, and monobank quotes the price again before anyone
     * pays.
     */
    price: string | null;
};

const FEATURES = [
    {
        icon: LuMapPinned,
        title: "Живе відстеження",
        desc: "Позиція на мапі в реальному часі, з точністю до кількох метрів.",
    },
    {
        icon: LuBellRing,
        title: "Push-сповіщення",
        desc: "Якщо пес відійде задалеко від вас, телефон одразу сповістить — навіть якщо додаток закритий.",
    },
    {
        icon: LuRadioTower,
        title: "Не губить дані",
        desc: "Якщо зв'язок зникає, дані чекають в черзі й надсилаються, щойно мережа повернеться.",
    },
    {
        icon: LuSiren,
        title: "Розуміє тривогу",
        desc: "Під час повітряної тривоги трекер частіше оновлює позицію — саме тоді, коли це важливо.",
    },
] as const;

type Waypoint = {
    label: string;
    title: string;
    colorPalette?: string;
    icon?: typeof LuPawPrint;
    body: ReactNode;
};

const WAYPOINTS: Waypoint[] = [
    {
        label: "Ідея",
        title: "Один хасюк, одна відкрита хвіртка",
        body: (
            <VStack align="start" gap="3">
                <Text color="fg.muted">
                    У мене сіро-білий хасюк. Він любить свободу — і кожна прогулянка без
                    повідця означає кілька секунд справжньої тривоги: а раптом побіжить за
                    котом і зникне за рогом? Готові трекери, які я знайшов, обіцяли рішення
                    на коробці, але не працювали там, де я живу.
                </Text>
                <Text color="fg.muted">
                    Тож я вирішив зробити пристрій сам — не як продукт для ринку, а як
                    річ, якій довіряю.
                </Text>
            </VStack>
        ),
    },
    {
        label: "Виклик",
        title: "Стандарти, які не ловлять сигнал в Україні",
        body: (
            <VStack align="start" gap="4">
                <Text color="fg.muted">
                    Більшість готових трекерів працюють на LTE-M або NB-IoT — стандартах,
                    які на українських мережах практично недоступні. Тобто пристрій міг
                    би виглядати ідеально в описі й мовчати саме тоді, коли потрібен
                    найбільше.
                </Text>
                <Box
                    bg="bg.muted"
                    borderLeftWidth="3px"
                    borderLeftColor="orange.solid"
                    rounded="md"
                    px="4"
                    py="3"
                    fontSize="sm"
                    color="fg.muted"
                    w="full"
                >
                    ESP32-S3 · LTE Cat-1 (A7670E) · GNSS · власна плата, розроблена з нуля в KiCad
                </Box>
            </VStack>
        ),
    },
    {
        label: "Що вміє Цуцик",
        title: "Простий пристрій, який не підводить у важливий момент",
        body: (
            <SimpleGrid columns={{base: 1, sm: 2}} gap="4">
                {FEATURES.map((feature) => (
                    <Card.Root key={feature.title} p="4" colorPalette="blue">
                        <HStack gap="2" mb="1">
                            <Icon as={feature.icon} boxSize="4" color="colorPalette.fg" />
                            <Text fontWeight="semibold" fontSize="sm">
                                {feature.title}
                            </Text>
                        </HStack>
                        <Text fontSize="sm" color="fg.muted">
                            {feature.desc}
                        </Text>
                    </Card.Root>
                ))}
            </SimpleGrid>
        ),
    },
    {
        label: "Зроблено в Україні",
        title: "Ручна робота, а не серійне виробництво — поки що",
        body: (
            <VStack align="start" gap="3">
                <Text color="fg.muted">
                    Кожна плата зараз збирається практично поштучно. Це не масовий продукт
                    і не обіцянка з презентації — це пристрій, який я сам ношу на
                    нашийнику власного пса й довіряю йому.
                </Text>
                <Text color="fg.muted">
                    Якщо щось не працює — я перероблюю схему, а не пишу вибачення в
                    службу підтримки.
                </Text>
            </VStack>
        ),
    },
    {
        label: "Зараз",
        title: "Цуцик ще молодий. Як і має бути.",
        colorPalette: "green",
        icon: LuPawPrint,
        body: (
            <VStack align="start" gap="3">
                <Badge colorPalette="orange" variant="subtle" rounded="full">
                    Ранній етап · перші прототипи в зборці
                </Badge>
                <Text color="fg.muted">
                    Проєкт росте повільно й уважно — так само, як я б хотів, щоб зростав
                    сам пес. Якщо історія відгукується або є що запитати — буду радий
                    почути.
                </Text>
            </VStack>
        ),
    },
];

const NavBar: FC = () => (
    <Box
        as="nav"
        position="sticky"
        top="0"
        zIndex="sticky"
        bg="bg/85"
        css={{backdropFilter: "blur(8px)"}}
        borderBottomWidth="1px"
    >
        <Container maxW={CONTENT_WIDTH} py="4">
            <HStack justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    Цуц<Text as="span" color="orange.fg">ик</Text>
                </Text>
                <HStack gap="3">
                    <Text
                        display={{base: "none", sm: "block"}}
                        fontSize="xs"
                        color="fg.muted"
                        textTransform="uppercase"
                        letterSpacing="wide"
                    >
                        Зроблено в Україні
                    </Text>
                    <Button asChild size="sm" variant="ghost" rounded="full">
                        <Link href="/orders">Замовлення</Link>
                    </Button>
                    {/* One entry point for both cases: /auth forwards a ґазда
                        who is already signed in straight to their tracker. */}
                    <Button asChild size="sm" variant="outline" rounded="full">
                        <Link href="/auth">Увійти</Link>
                    </Button>
                    <ColorModeButton />
                </HStack>
            </HStack>
        </Container>
    </Box>
);

const Hero: FC<LandingProps> = ({productId, price}) => (
    <Box as="header" pt={{base: 14, md: 20}} pb={{base: 10, md: 14}}>
        <Container maxW={CONTENT_WIDTH}>
            <HStack colorPalette="orange" gap="2" mb="5">
                <Box boxSize="1.5" rounded="full" bg="colorPalette.solid" />
                <Text fontSize="sm" fontWeight="medium" color="colorPalette.fg">
                    Особистий проєкт · не стартап
                </Text>
            </HStack>

            <Heading as="h1" size={{base: "3xl", md: "5xl"}} lineHeight="1.15" maxW="22ch" mb="6">
                Я завжди знаю, де мій пес.{" "}
                <Text as="span" color="blue.fg">
                    Тепер знатимете й ви.
                </Text>
            </Heading>

            <Text fontSize="lg" color="fg.muted" maxW="46ch" mb="8">
                Цуцик — це GPS/LTE-трекер на нашийник, який я спроєктував сам, тому що
                одного разу не знав, де мій хасюк, і ця мить тривоги більше не мала повторитись.
            </Text>

            {/* Пристрої збираються поштучно, тож це передзамовлення, а не
                покупка зі складу — формулювання має збігатися з таймлайном нижче. */}
            <Box mb="10">
                <PayButton
                    productId={productId}
                    size="lg"
                    colorPalette="orange"
                    rounded="full"
                    caption={null}
                >
                    {price ? `Передзамовити за ${price} (тестується)` : "Передзамовити (тестується)"}
                </PayButton>
            </Box>

            <Card.Root
                display="inline-flex"
                flexDirection="row"
                alignItems="center"
                gap="4"
                rounded="full"
                py="2"
                pl="2"
                pr="6"
                shadow="sm"
            >
                <Box position="relative" flexShrink="0">
                    <Avatar.Root size="lg">
                        <Avatar.Fallback name="Карематик" />
                        <Avatar.Image src="/karemat.jpg" alt="Карематик" />
                    </Avatar.Root>
                    <Float placement="bottom-end" offsetX="1" offsetY="1">
                        <Status.Root colorPalette="green" size="sm">
                            <Status.Indicator />
                        </Status.Root>
                    </Float>
                </Box>
                <VStack align="start" gap="0.5">
                    <Text fontWeight="semibold">Карематик</Text>
                    <HStack gap="2" fontSize="xs" color="fg.muted">
                        <HStack gap="1" color="green.fg">
                            <Icon as={BiSolidBatteryCharging} boxSize="3.5" />
                            <Text as="span">82%</Text>
                        </HStack>
                        <Text as="span" color="green.fg">на зв&apos;язку</Text>
                        <Text as="span">оновлено 4 хв тому</Text>
                    </HStack>
                </VStack>
            </Card.Root>
        </Container>
    </Box>
);

const Story: FC = () => (
    <Box as="main" py={{base: 6, md: 10}}>
        <Container maxW={CONTENT_WIDTH}>
            <Timeline.Root>
                {WAYPOINTS.map((waypoint) => (
                    <Timeline.Item key={waypoint.label}>
                        <Timeline.Connector>
                            <Timeline.Separator />
                            <Timeline.Indicator colorPalette={waypoint.colorPalette ?? "gray"}>
                                {waypoint.icon && <Icon as={waypoint.icon} boxSize="3" />}
                            </Timeline.Indicator>
                        </Timeline.Connector>
                        <Timeline.Content>
                            <Text
                                fontSize="xs"
                                fontWeight="semibold"
                                color="orange.fg"
                                textTransform="uppercase"
                                letterSpacing="wide"
                                mb="2"
                            >
                                {waypoint.label}
                            </Text>
                            <Heading as="h2" size="lg" mb="4">
                                {waypoint.title}
                            </Heading>
                            {waypoint.body}
                        </Timeline.Content>
                    </Timeline.Item>
                ))}
            </Timeline.Root>
        </Container>
    </Box>
);

const Closing: FC = () => (
    <Box as="section" bg="bg.inverted" color="fg.inverted" py={{base: 16, md: 20}} mt="10">
        <Container maxW="2xl">
            <Heading as="h2" size={{base: "xl", md: "2xl"}} mb="4">
                Хочете дізнатись, як просувається Цуцик?
            </Heading>
            <Text opacity="0.75" maxW="50ch" mb="8" fontSize="lg">
                Пишіть — розповім, на якому етапі зараз пристрій, і покажу, як він працює насправді.
            </Text>
            <Button asChild size="lg" colorPalette="orange" rounded="full">
                <a href="mailto:hello@tsutsyk.live">
                    Написати мені
                    <LuArrowRight />
                </a>
            </Button>
        </Container>
    </Box>
);

const Footer: FC = () => (
    <Box as="footer" py={{base: 8, md: 10}} textAlign="center">
        <Container maxW="2xl">
            <Text fontSize="sm" color="fg.muted">
                Цуцик — особистий проєкт. Зроблено з любові до одного конкретного хасюка.
            </Text>
        </Container>
    </Box>
);

const Landing: FC<LandingProps> = (props) => (
    <Box>
        <NavBar />
        <Hero {...props} />
        <Story />
        <Closing />
        <Footer />
    </Box>
);

export default Landing;
