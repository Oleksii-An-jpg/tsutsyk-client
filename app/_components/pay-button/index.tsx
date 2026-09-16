'use client';

import { FC, useActionState } from "react";
import { Button, type ButtonProps, Text, VStack } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";

import { startCheckout } from "@/app/_actions/checkout";

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
 */
const PayButton: FC<PayButtonProps> = ({
    productId,
    quantity = 1,
    children,
    caption = "Картка, Apple Pay, Google Pay або monobank",
    ...buttonProps
}) => {
    const [state, formAction, pending] = useActionState(startCheckout, null);

    return (
        <form action={formAction}>
            <VStack align="start" gap="2">
                <input type="hidden" name="productId" value={productId} />
                <input type="hidden" name="quantity" value={quantity} />

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
