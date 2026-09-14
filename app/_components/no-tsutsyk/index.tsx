'use client';

import {FC} from 'react';
import {useRouter} from 'next/navigation';
import {
    Button,
    Card,
    Container,
    Field,
    HStack,
    Heading,
    Input,
    Link as ChakraLink,
    Stack,
    Text,
} from '@chakra-ui/react';
import Link from 'next/link';
import {useForm} from 'react-hook-form';
import {auth} from '@/app/_lib/firebase';

type Values = {
    code: string;
};

// Someone who can't scan usually has the link rather than the bare id — off a
// chat message, or the collar tag read out loud — so take either.
function extractId(input: string) {
    const trimmed = input.trim();
    return (trimmed.match(/tsutsyk\/([^/?#\s]+)/)?.[1] ?? trimmed).trim();
}

// Owning no Tsutsyk is where every new account starts, not a permission
// failure: the only way to own one is to claim a device, and the only way to
// claim is to arrive here first. So this screen has to offer the way forward
// rather than just report the state.
const NoTsutsyk: FC = () => {
    const router = useRouter();
    const {register, handleSubmit, formState: {errors}} = useForm<Values>();

    const onSubmit = handleSubmit(({code}) => {
        router.push(`/tsutsyk/${encodeURIComponent(extractId(code))}`);
    });

    return (
        <Container maxW="2xl" py={16}>
            <Card.Root>
                <Card.Header>
                    <Heading size="lg">Ще жодного цуцика</Heading>
                    <Text fontSize="sm" color="fg.muted">
                        Обліковий запис є — лишилось прив&#39;язати до нього пристрій.
                    </Text>
                </Card.Header>

                <Card.Body>
                    <Stack as="form" gap={4} onSubmit={onSubmit}>
                        <Text fontSize="sm" color="fg.muted">
                            Найпростіше — відсканувати QR-код на нашийнику. Якщо камера його не
                            бере або ви за комп&#39;ютером, введіть код пристрою вручну.
                        </Text>

                        <Field.Root required invalid={!!errors.code}>
                            <Field.Label>Код пристрою</Field.Label>
                            <Input
                                placeholder="код або посилання з нашийника"
                                {...register('code', {required: 'Вкажіть код пристрою'})}
                            />
                            <Field.ErrorText>{errors.code?.message}</Field.ErrorText>
                        </Field.Root>

                        <Button type="submit" colorPalette="blue">
                            Знайти цуцика
                        </Button>
                    </Stack>
                </Card.Body>

                <Card.Footer>
                    <HStack w="full" wrap="wrap" justify="space-between" gap={3}>
                        <Text fontSize="sm" color="fg.muted">
                            Ще не маєте пристрою?{' '}
                            <ChakraLink variant="underline" asChild>
                                <Link href="mailto:hello@tsutsyk.live">Напишіть мені</Link>
                            </ChakraLink>
                        </Text>
                        <Button size="sm" variant="outline" onClick={() => auth.signOut()}>
                            Вийти
                        </Button>
                    </HStack>
                </Card.Footer>
            </Card.Root>
        </Container>
    );
};

export default NoTsutsyk;
