import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    // Development only. Next blocks cross-origin requests to dev assets, which
    // breaks loading the app through a tunnel. Wildcards cover the hostname
    // each provider hands out per run. (monobank's webhook goes to the API,
    // not here — that tunnel is the API's business.)
    allowedDevOrigins: [
        "*.trycloudflare.com",
        "*.lhr.life",
        "*.loca.lt",
        "*.ngrok-free.app",
    ],
    experimental: {
        optimizePackageImports: ["@chakra-ui/react"],
    },
    compiler: {
        emotion: true,
    },
};

export default nextConfig;
