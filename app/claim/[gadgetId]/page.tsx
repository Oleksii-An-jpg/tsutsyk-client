import ClaimGadget from "@/app/claim/[gadgetId]/_ui/claim-gadget";

export default async function Page({
    params,
}: {
    params: Promise<{ gadgetId: string }>;
}) {
    const { gadgetId } = await params;
    return <ClaimGadget gadgetId={gadgetId} />;
}
