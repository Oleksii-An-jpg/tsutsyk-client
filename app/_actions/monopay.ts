'use server'

import { randomUUID } from "node:crypto";

import { signOrder, UAH, type SignedOrder } from "@/app/_lib/monopay";
import { getProduct } from "@/app/_lib/products";

export type PrepareResult =
    | { ok: true; order: SignedOrder }
    | { ok: false; error: string };

/**
 * Signs an order for the monopay widget.
 *
 * A Server Action is a public endpoint, so this trusts nothing from the caller
 * but a product id and a quantity — the price comes from the server-side
 * catalogue. Otherwise the amount could simply be edited on its way in.
 */
export async function prepareMonopayOrder(input: {
    productId: string;
    quantity: number;
}): Promise<PrepareResult> {
    const product = getProduct(input.productId);
    if (!product) {
        return { ok: false, error: "Такого товару немає." };
    }

    const quantity = Number(input.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > product.maxQuantity) {
        return {
            ok: false,
            error: `Можна замовити від 1 до ${product.maxQuantity} шт. за раз.`,
        };
    }

    const amount = product.price * quantity;

    try {
        return {
            ok: true,
            order: signOrder({
                orderId: randomUUID(),
                amount,
                ccy: UAH,
                items: [{ name: product.name, qty: quantity, sum: amount }],
            }),
        };
    } catch (error) {
        // A missing or malformed key is a deployment problem, not something the
        // buyer can act on — log it here and keep the message generic.
        console.error("[monopay] could not sign order", error);
        return { ok: false, error: "Оплата тимчасово недоступна." };
    }
}
