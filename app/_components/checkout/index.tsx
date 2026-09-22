'use client';

import {FC, startTransition, useActionState} from "react";
import {
    AbsoluteCenter,
    Alert,
    Button,
    Card,
    Container,
    Heading,
    HStack,
    Separator,
    Spinner,
    Stack,
    Text,
} from "@chakra-ui/react";
import {LuArrowRight} from "react-icons/lu";
import {useForm} from "react-hook-form";
import {useReactiveVar} from "@apollo/client/react";
import {auth} from "@/app/_lib/firebase";
import {me, userPhone} from "@/app/_lib/me";
import {useAdminAuth} from "@/app/_hooks/useAdminAuth";
import {formatPrice, toLocalPhone} from "@/app/_lib/format";
import {CheckoutInput, CheckoutState, startCheckout} from "@/app/_actions/checkout";
import AuthCard from "@/app/_components/auth";
import DeliveryFields, {DeliveryValues} from "@/app/_components/delivery-fields";
import Link from "next/link";

export type CheckoutProduct = {
    id: string;
    name: string;
    description: string;
    price: number;
    unit: string;
    maxQuantity: number;
};

type CheckoutProps = {
    /** Null when the catalogue could not be read — the API is the price. */
    product: CheckoutProduct | null;
    quantity: number;
};

/**
 * tsutsyk.live/checkout — sign in, say where it should go, then pay.
 *
 * Both steps are required, and they are the same decision: an order we cannot
 * deliver, or whose customer we cannot reach, is money we have to give back.
 * The account is not friction checkout invents either — a Tsutsyk is unusable
 * without one, so this only moves a step the buyer takes anyway to the point
 * where it also settles the address.
 */
const Checkout: FC<CheckoutProps> = ({product, quantity}) => {
    useAdminAuth();
    const {checked, authenticated, user} = useReactiveVar(me);

    if (!product) {
        return (
            <Container maxW="2xl" py={{base: 8, md: 16}}>
                <Alert.Root status="error" rounded="xl">
                    <Alert.Indicator />
                    <Alert.Content>
                        <Alert.Title>Не вдалося завантажити товар</Alert.Title>
                        <Alert.Description>
                            Оновіть сторінку за хвилину — ми вже дивимося, що сталося.
                        </Alert.Description>
                    </Alert.Content>
                </Alert.Root>
            </Container>
        );
    }

    if (!checked) {
        return (
            <AbsoluteCenter>
                <Spinner size="xl" colorPalette="blue" />
            </AbsoluteCenter>
        );
    }

    if (!authenticated) {
        return (
            <Container maxW="2xl" py={{base: 8, md: 16}}>
                <Stack gap={6}>
                    <Stack gap={2}>
                        {/* No way home in this header: the card below is the
                            screen's own heading while signing in, and it
                            carries the link — as it does on /auth, /orders
                            and the admin panel. */}
                        <Heading color="fg" size="xl">Оформлення</Heading>
                        <Text color="fg.muted">
                            Спершу увійдіть: акаунт потрібен, щоб користуватися трекером,
                            і саме в ньому ви стежитимете за замовленням.
                        </Text>
                    </Stack>
                    <AuthCard title="Вхід" />
                </Stack>
            </Container>
        );
    }

    return (
        <Container maxW="2xl" py={{base: 8, md: 16}}>
            <CheckoutForm
                product={product}
                quantity={quantity}
                phone={userPhone(user)}
            />
        </Container>
    );
};

const CheckoutForm: FC<{
    product: CheckoutProduct;
    quantity: number;
    phone?: string | null;
}> = ({product, quantity, phone}) => {
    // Both type arguments spelled out: useActionState's payload overload is
    // otherwise inferred, and an editor that resolves a different React types
    // copy can land on the `FormData` shape a <form action> would use.
    const [state, formAction, pending] = useActionState<CheckoutState, CheckoutInput>(
        startCheckout,
        null,
    );

    const {register, handleSubmit, control, formState: {errors}} = useForm<DeliveryValues>({
        // Quiet while typing, honest on the submit attempt, live as it is
        // corrected — the same bargain the sign-in form strikes.
        mode: 'onTouched',
        defaultValues: {
            recipientName: '',
            // The account's own number is the likeliest answer; the field holds
            // the part after the +380 it shows as a prefix.
            phone: toLocalPhone(phone),
            city: '',
            branch: '',
            comment: '',
        },
    });

    const onSubmit = handleSubmit((delivery) => {
        // The action is invoked rather than posted to, so the ID token can be
        // read here — fresh, at the moment of paying, rather than kept in a
        // field that goes stale on a page left open. A Server Action runs on
        // the server, where the Firebase session in this tab does not exist.
        startTransition(async () => {
            const idToken = (await auth.currentUser?.getIdToken()) ?? '';
            // An await ends the transition it happened in, so the call after
            // it needs one of its own — otherwise `pending` never turns on.
            startTransition(() => {
                formAction({productId: product.id, quantity, idToken, delivery});
            });
        });
    });

    const total = product.price * quantity;

    return (
        <Stack as="form" gap={6} onSubmit={onSubmit}>
            <Stack gap={2}>
                <HStack justify="space-between">
                    <Heading color="fg" size="xl">Оформлення</Heading>
                    <Button asChild size="sm" variant="subtle">
                        <Link href="/">На головну</Link>
                    </Button>
                </HStack>
                <Text color="fg.muted">
                    Пристрої збираються поштучно, тож це передзамовлення. Дані доставки
                    можна буде змінити, поки замовлення не поїхало.
                </Text>
            </Stack>

            <Card.Root>
                <Card.Body>
                    <HStack justify="space-between" wrap="wrap" gap={3}>
                        <Stack gap={0}>
                            <Text fontWeight="medium">{product.name}</Text>
                            <Text fontSize="sm" color="fg.muted">
                                {quantity} {product.unit} × {formatPrice(product.price)}
                            </Text>
                        </Stack>
                        <Heading size="lg">{formatPrice(total)}</Heading>
                    </HStack>
                </Card.Body>
            </Card.Root>

            <Card.Root>
                <Card.Header>
                    <Heading size="md">Куди привезти</Heading>
                </Card.Header>
                <Card.Body>
                    <DeliveryFields register={register} errors={errors} control={control} />
                </Card.Body>
            </Card.Root>

            <Separator />

            <Stack gap={2} align="start">
                <Button
                    type="submit"
                    size="lg"
                    colorPalette="orange"
                    rounded="full"
                    loading={pending}
                    loadingText="Готуємо оплату…"
                >
                    Оплатити {formatPrice(total)}
                    <LuArrowRight />
                </Button>

                {state?.error ? (
                    <Text fontSize="sm" color="red.fg" role="alert">
                        {state.error}
                    </Text>
                ) : (
                    <Text fontSize="xs" color="fg.muted">
                        Картка, Apple Pay, Google Pay або monobank
                    </Text>
                )}
            </Stack>
        </Stack>
    );
};

export default Checkout;
