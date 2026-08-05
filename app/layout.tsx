import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "@/app/_lib/provider";
import { Provider as ChakraProvider } from '@/components/ui/provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Tsutsyk Live",
    description: "Додаток, який завжди знає, де твій хвостик",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
        <head>
            {/* Preconnect to Firebase auth and Google Maps — overlaps TLS handshakes
                with React hydration, especially valuable in PWA standalone mode where
                there is no shared connection pool with the browser. */}
            <link rel="preconnect" href="https://securetoken.googleapis.com" />
            <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
            <link rel="preconnect" href="https://maps.googleapis.com" />
            <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
            <title>Tsutsyk Live</title>
        </head>
        <Provider>
            <ChakraProvider>
                <body className="min-h-full flex flex-col">{children}</body>
            </ChakraProvider>
        </Provider>
    </html>
  );
}
