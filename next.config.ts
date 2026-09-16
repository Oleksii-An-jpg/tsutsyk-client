import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    // Development only. Next blocks cross-origin requests to dev assets, which
    // breaks loading the app through a tunnel — and a tunnel is the only way to
    // reach it from a real https origin, which monopay and its webhook both
    // need. Wildcards cover the hostname each provider hands out per run.
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
