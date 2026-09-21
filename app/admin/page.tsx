import { Suspense } from "react";
import type { Metadata } from "next";
import { AbsoluteCenter, Spinner } from "@chakra-ui/react";
import AdminOrders from "@/app/_components/admin/orders";

// Nobody's back office belongs in a search index. The gate is the `admin`
// claim, not this — but a crawler that finds the address and files it away is
// an invitation for somebody to go rattling the door.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

export default function Page() {
    // The queue keeps its status filter in the URL, so a link to "everything
    // waiting to be packed" is a link somebody can bookmark. Reading it with
    // useSearchParams would otherwise drag this page into client-side
    // rendering — the same bargain /orders strikes.
    return (
        <Suspense
            fallback={
                <AbsoluteCenter>
                    <Spinner size="xl" colorPalette="blue" />
                </AbsoluteCenter>
            }
        >
            <AdminOrders />
        </Suspense>
    );
}
