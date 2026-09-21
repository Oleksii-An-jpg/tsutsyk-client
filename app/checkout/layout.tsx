import {Box} from "@chakra-ui/react";

export default function CheckoutLayout({
                                           children,
                                       }: Readonly<{
    children: React.ReactNode;
}>) {
    return <Box bg="bg">
        {children}
    </Box>
}