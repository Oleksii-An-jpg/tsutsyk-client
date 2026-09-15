import {Container} from "@chakra-ui/react";
import {ReactNode} from "react";

export default function Layout({
                                   children,
                               }: Readonly<{
    children: ReactNode;
}>) {
    return <Container pl={2} py={4}>{children}</Container>
}
