'use client';

import { FC, useEffect, useRef, useState } from "react";
import { Box, Skeleton, Text, VStack } from "@chakra-ui/react";
import Script from "next/script";

import { prepareMonopayOrder } from "@/app/_actions/monopay";
import type { SignedOrder } from "@/app/_lib/monopay";

/**
 * monobank hosts the widget; the env var exists only so a staging build can
 * pin a different version without a code change.
 */
const WIDGET_SRC =
    process.env.NEXT_PUBLIC_MONOPAY_WIDGET_SRC ??
    "https://pay.monobank.ua/mono-pay-button/v1/mono-pay-button.js";

/**
 * The slice of the widget API we use. The docs list more UI options than this,
 * but adding them blind would be guesswork.
 */
type MonoPayInit = SignedOrder & {
    onSuccess?: (result: unknown) => void;
    onError?: (error: unknown) => void;
};

declare global {
    interface Window {
        MonoPay?: {
            init: (options: MonoPayInit) => unknown;
        };
    }
}

/**
 * `init` hands back the button element to mount. The docs call it "the button
 * element" but the widget may wrap it in an object, so accept either rather
 * than depend on a shape the saved docs do not pin down.
 */
function resolveButtonElement(result: unknown): HTMLElement | null {
    if (result instanceof HTMLElement) return result;
    if (result && typeof result === "object") {
        for (const key of ["button", "element", "el", "node"]) {
            const candidate = (result as Record<string, unknown>)[key];
            if (candidate instanceof HTMLElement) return candidate;
        }
    }
    return null;
}

type MonopayButtonProps = {
    productId: string;
    quantity?: number;
    /** Runs when monopay reports the payment succeeded. */
    onPaid?: () => void;
};

/**
 * The monopay button.
 *
 * monobank renders the button itself — we sign an order, hand it to the widget
 * and mount whatever it gives back. The widget owns everything after the click:
 * invoice creation, the QR on desktop, the hand-off to the app on mobile.
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

                const button = resolveButtonElement(
                    window.MonoPay.init({
                        ...result.order,
                        onSuccess: () => onPaidRef.current?.(),
                        onError: (widgetError: unknown) => {
                            console.error("[monopay] widget error", widgetError);
                            setError("Оплата не пройшла. Спробуйте ще раз.");
                        },
                    })
                );

                if (!button) {
                    throw new Error("MonoPay.init did not return a button element");
                }
                if (cancelled) return;

                container.replaceChildren(button);
                setWidgetReady(true);
            } catch (initError) {
                console.error("[monopay] could not mount the widget", initError);
                setError("Оплата тимчасово недоступна.");
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [scriptReady, productId, quantity]);

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
