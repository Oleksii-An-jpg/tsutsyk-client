import Landing from "@/app/_components/landing";
import { formatPrice, PRODUCTS } from "@/app/_lib/products";

export default function Home() {
    // Formatted here, in a Server Component, so the price catalogue stays on
    // the server and the client only ever sends a product id to checkout.
    const tracker = PRODUCTS["tsutsyk-tracker"];

    return <Landing productId={tracker.id} price={formatPrice(tracker.price)} />;
}
