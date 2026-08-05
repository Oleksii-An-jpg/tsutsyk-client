import Onboarding from "@/app/_components/onboarding";

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
    const { id } = await params;
    return <Onboarding id={id} />;
}
