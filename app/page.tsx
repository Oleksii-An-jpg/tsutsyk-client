import Landing from "@/app/_components/landing";
import { getProduct } from "@/app/_lib/catalogue";
import { formatPrice } from "@/app/_lib/format";

const TRACKER_ID = "tsutsyk-tracker";

export default async function Home() {
    // The catalogue comes from the API — the same code that prices the
    // invoice — so this page cannot quote a price we do not charge. Formatted
    // here, in a Server Component, so checkout still only ever sends an id.
    const tracker = await getProduct(TRACKER_ID);

    return (
        <Landing
            productId={TRACKER_ID}
            price={tracker ? formatPrice(tracker.price) : null}
        />
    );
}
