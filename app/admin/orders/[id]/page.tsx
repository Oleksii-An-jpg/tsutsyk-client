import type { Metadata } from "next";
import AdminOrder from "@/app/_components/admin/order";

// Nobody's back office belongs in a search index. The gate is the `admin`
// claim, not this — but a crawler that finds the address and files it away is
// an invitation for somebody to go rattling the door.
export const metadata: Metadata = {
    robots: { index: false, follow: false },
};

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <AdminOrder id={id} />;
}
