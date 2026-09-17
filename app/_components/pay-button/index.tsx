'use client';

import { FC } from "react";
import { Button, type ButtonProps, Text, VStack } from "@chakra-ui/react";
import { LuArrowRight } from "react-icons/lu";
import Link from "next/link";

type PayButtonProps = Omit<ButtonProps, "onClick" | "loading" | "type"> & {
    productId: string;
    quantity?: number;
    children: React.ReactNode;
    /** Small print under the button. Pass `null` to drop it. */
    caption?: React.ReactNode;
};

/**
 * Sends the buyer to checkout.
 *
 * It used to post straight to a Server Action that opened the invoice, which
 * made for a fine one-click purchase and an order we could not deliver: the
 * address, and the account that owns the order, are both collected on
 * /checkout now. This is a link, so it is still a real navigation rather than
 * something that only works once JavaScript has loaded.
 */
const PayButton: FC<PayButtonProps> = ({
    productId,
    quantity = 1,
    children,
    caption = "Картка, Apple Pay, Google Pay або monobank",
    ...buttonProps
}) => (
    <VStack align="start" gap="2">
        <Button asChild {...buttonProps}>
            <Link href={`/checkout?product=${productId}&quantity=${quantity}`}>
                {children}
                <LuArrowRight />
            </Link>
        </Button>

        {caption && (
            <Text fontSize="xs" color="fg.muted">
                {caption}
            </Text>
        )}
    </VStack>
);

export default PayButton;
