'use client';

import { FC, useEffect, useRef, useState } from "react";
import { Box, Skeleton, Text, VStack } from "@chakra-ui/react";
import Script from "next/script";

import { prepareMonopayOrder } from "@/app/_actions/monopay";
import { REQUEST_ID_TTL_MS, type SignedOrder } from "@/app/_lib/monopay";
import { useColorMode } from "@/components/ui/color-mode";

/**
 * monobank hosts the widget; the env var exists only so a staging build can
 * pin a different version without a code change.
 */
const WIDGET_SRC =
    process.env.NEXT_PUBLIC_MONOPAY_WIDGET_SRC ??
    "https://pay.monobank.ua/mono-pay-button/v1/mono-pay-button.js";

/** Re-sign a little before monobank expires the requestId, not exactly on it. */
const RESIGN_AFTER_MS = REQUEST_ID_TTL_MS - 60_000;

type MonoPayConfig = SignedOrder & {
    ui?: {
        buttonType?: "base" | "pay";
        theme?: "light" | "dark";
        corners?: "rounded" | "base";
    };
    callbacks?: {
        onButtonReady?: () => void;
        onClick?: () => void;
        onInvoiceCreate?: (data: unknown) => void;
        onSuccess?: (result: unknown) => void;
        onError?: (error: unknown) => void;
    };
};

declare global {
    interface Window {
        MonoPay?: {
            init: (config: MonoPayConfig) => { button: HTMLElement };
            update: (config: Partial<MonoPayConfig>) => void;
            destroy: () => void;
        };
    }
}

type MonopayButtonProps = {
    productId: string;
    quantity?: number;
    /** Runs when monopay reports the payment succeeded. */
    onPaid?: (result: unknown) => void;
};

/**
 * The monopay button.
 *
 * monobank renders the button itself — we sign an order, hand it to the widget
 * and mount the element it gives back. The widget owns everything after the
 * click: invoice creation, the QR on desktop, the hand-off to the app on mobile.
 */
const MonopayButton: FC<MonopayButtonProps> = ({
    productId,
    quantity = 1,
    onPaid,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scriptReady, setScriptReady] = useState(false);
    const [widgetReady, setWidgetReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Bumped to re-sign once the requestId is close to expiring.
    const [attempt, setAttempt] = useState(0);
    const { colorMode } = useColorMode();

    // Held in a ref so an inline `onPaid` from the parent cannot retrigger the
    // effect below and mount the widget twice.
    const onPaidRef = useRef(onPaid);
    useEffect(() => {
        onPaidRef.current = onPaid;
    }, [onPaid]);

    useEffect(() => {
        if (!scriptReady) return;

        const container = containerRef.current;
        if (!container) return;

        let cancelled = false;
        let resignTimer: ReturnType<typeof setTimeout> | undefined;

        // One async pass: sign the order, then hand it to the widget. The
        // widget needs a signed payload at init time — before the buyer
        // clicks — so this cannot wait for a click handler.
        (async () => {
            const result = await prepareMonopayOrder({ productId, quantity });
            if (cancelled) return;

            if (!result.ok) {
                setError(result.error);
                return;
            }

            try {
                if (!window.MonoPay) {
                    throw new Error("the monopay widget did not register itself");
                }

                const { button } = window.MonoPay.init({
                    ...result.order,
                    ui: {
                        buttonType: "base",
                        theme: colorMode === "light" ? "light" : "dark",
                        corners: "rounded",
                    },
                    callbacks: {
                        onSuccess: (paid) => onPaidRef.current?.(paid),
                        onError: (widgetError) => {
                            console.error("[monopay] widget error", widgetError);
                            setError("Оплата не пройшла. Спробуйте ще раз.");
                        },
                    },
                });

                if (cancelled) return;

                container.replaceChildren(button);
                setWidgetReady(true);

                // monobank expires the requestId after 10 minutes. On a page
                // left open, re-run this effect to sign a fresh one rather than
                // let the buyer click a button that is already dead.
                resignTimer = setTimeout(() => {
                    if (!cancelled) setAttempt((n) => n + 1);
                }, RESIGN_AFTER_MS);
            } catch (initError) {
                console.error("[monopay] could not mount the widget", initError);
                setError("Оплата тимчасово недоступна.");
            }
        })();

        return () => {
            cancelled = true;
            clearTimeout(resignTimer);
            // Let the widget tear down its own listeners before we drop the
            // element it gave us.
            try {
                window.MonoPay?.destroy();
            } catch (destroyError) {
                console.error("[monopay] destroy failed", destroyError);
            }
        };
    }, [scriptReady, productId, quantity, colorMode, attempt]);

    return (
        <VStack align="start" gap="2">
            <Script
                src={WIDGET_SRC}
                strategy="lazyOnload"
                onReady={() => setScriptReady(true)}
                onError={() => setError("Не вдалося завантажити monopay.")}
            />

            {/* React never renders children here — the widget's own element is
                mounted into it imperatively. It stays collapsed until then, so
                the skeleton below is the only thing holding the space. */}
            <Box ref={containerRef} minW="3xs" />

            {!widgetReady && !error && (
                <Skeleton height="12" width="3xs" rounded="full" />
            )}

            {error && (
                <Text fontSize="sm" color="red.fg" role="alert">
                    {error}
                </Text>
            )}
        </VStack>
    );
};

export default MonopayButton;
