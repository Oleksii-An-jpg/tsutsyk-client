import {Container} from "@chakra-ui/react";

export default function Layout({
                                    children,
                                }: Readonly<{
    children: React.ReactNode;
}>) {
    return <Container maxW="2xl" py={8}>{children}</Container>
}
