import {Container} from "@chakra-ui/react";

export default function Layout({
                                   children,
                               }: Readonly<{
    children: React.ReactNode;
}>) {
    return <Container pl={2} py={4}>{children}</Container>
}
