'use client';

import { FC, useActionState, useEffect, useState } from "react";
import { Button, type ButtonProps, Text, VStack } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";
import { onAuthStateChanged } from "firebase/auth";

import { startCheckout } from "@/app/_actions/checkout";
import { auth } from "@/app/_lib/firebase";

type PayButtonProps = Omit<ButtonProps, "onClick" | "loading" | "type"> & {
    productId: string;
    quantity?: number;
    children: React.ReactNode;
    /** Small print under the button. Pass `null` to drop it. */
    caption?: React.ReactNode;
};

/**
 * Starts a monobank checkout.
 *
 * A real form posting to a Server Action, rather than a click handler: the
 * action answers with a redirect to monobank's payment page, so the whole
 * purchase still works with JavaScript disabled. The amount never travels from
 * here — only a product id and a quantity — so the price cannot be tampered
 * with in devtools.
 *
 * A signed-in buyer's ID token rides along so the API can attach the order to
 * their account there and then. Without it — nobody signed in, or JavaScript
 * off — the order is placed as a guest and claimed later with its number.
 */
const PayButton: FC<PayButtonProps> = ({
    productId,
    quantity = 1,
    children,
    caption = "Картка, Apple Pay, Google Pay або monobank",
    ...buttonProps
}) => {
    const [state, formAction, pending] = useActionState(startCheckout, null);
    const [idToken, setIdToken] = useState("");

    // Kept in a field rather than read inside the action: a Server Action runs
    // on the server, where the Firebase session in this tab does not exist.
    useEffect(
        () =>
            onAuthStateChanged(auth, (user) => {
                if (!user) {
                    setIdToken("");
                    return;
                }
                user.getIdToken().then(setIdToken, () => setIdToken(""));
            }),
        []
    );

    return (
        <form action={formAction}>
            <VStack align="start" gap="2">
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="quantity" value={quantity} />
                <input type="hidden" name="idToken" value={idToken} />

                <Button
                    type="submit"
                    loading={pending}
                    loadingText="Готуємо оплату…"
                    {...buttonProps}
                >
                    {children}
                    <LuArrowRight />
                </Button>

                {state?.error ? (
                    <Text fontSize="sm" color="red.fg" role="alert">
                        {state.error}
                    </Text>
                ) : (
                    caption && (
                        <Text fontSize="xs" color="fg.muted">
                            {caption}
                        </Text>
                    )
                )}
            </VStack>
        </form>
    );
};

export default PayButton;
