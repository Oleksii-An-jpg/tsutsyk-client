'use client';

import { FC, useState, useTransition } from "react";
import { Button, type ButtonProps, Text, VStack } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";

import { startCheckout } from "@/app/_actions/checkout";

type PayButtonProps = Omit<ButtonProps, "onClick" | "loading"> & {
    productId: string;
    quantity?: number;
    children: React.ReactNode;
    /** Small print under the button. Pass `null` to drop it. */
    caption?: React.ReactNode;
};

/**
 * Starts a monobank checkout.
 *
 * Asks the server to open an invoice, then hands the browser to monobank's
 * hosted payment page, which offers card, Apple Pay, Google Pay and the
 * monobank app. The amount never travels from here — only a product id and a
 * quantity — so the price cannot be tampered with in devtools.
 */
const PayButton: FC<PayButtonProps> = ({
    productId,
    quantity = 1,
    children,
    caption = "Картка, Apple Pay, Google Pay або monobank",
    ...buttonProps
}) => {
    const [pending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const handleClick = () => {
        setError(null);

        startTransition(async () => {
            const result = await startCheckout({ productId, quantity });

            if (!result.ok) {
                setError(result.error);
                return;
            }

            // A full navigation, not a router push: the payment page is another
            // origin, and the buyer must come back through `redirectUrl`.
            window.location.assign(result.pageUrl);
        });
    };

    return (
        <VStack align="start" gap="2">
            <Button
                onClick={handleClick}
                loading={pending}
                loadingText="Готуємо оплату…"
                {...buttonProps}
            >
                {children}
                <LuArrowRight />
            </Button>

            {error ? (
                <Text fontSize="sm" color="red.fg" role="alert">
                    {error}
                </Text>
            ) : (
                caption && (
                    <Text fontSize="xs" color="fg.muted">
                        {caption}
                    </Text>
                )
            )}
        </VStack>
    );
};

export default PayButton;
