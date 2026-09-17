import { Suspense } from "react";
import { AbsoluteCenter, Spinner } from "@chakra-ui/react";
import Orders from "@/app/_components/orders";

export default function Page() {
    // Orders reads ?order= from the monobank return, and useSearchParams would
    // otherwise drag this prerendered page into client-side rendering.
    return (
        <Suspense
            fallback={
                <AbsoluteCenter>
                    <Spinner size="xl" colorPalette="blue" />
                </AbsoluteCenter>
            }
        >
            <Orders />
        </Suspense>
    );
}
