import Checkout from "@/app/_components/checkout";
import { getProduct } from "@/app/_lib/catalogue";
import {novaposhta} from "@/app/_lib/novaposhta";

type PageProps = {
    searchParams: Promise<{ product?: string; quantity?: string }>;
};

const DEFAULT_PRODUCT = "tsutsyk-tracker";

export default async function Page({ searchParams }: PageProps) {
    const { product: productId, quantity } = await searchParams;

    // Read here, in a Server Component, so the catalogue — and the price the
    // API will actually charge — never has to be trusted from the browser.
    const product = await getProduct(productId || DEFAULT_PRODUCT);
    const regions = await novaposhta.regions();

    const wanted = Number(quantity ?? 1);
    const asked =
        Number.isInteger(wanted) && wanted > 0
            ? Math.min(wanted, product?.maxQuantity ?? 1)
            : 1;

    return <Checkout regions={regions} product={product} quantity={asked} />;
}
