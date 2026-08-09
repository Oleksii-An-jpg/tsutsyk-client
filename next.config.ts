import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactCompiler: true,
    experimental: {
        optimizePackageImports: ["@chakra-ui/react"],
    },
    compiler: {
        emotion: true,
    },
};

export default nextConfig;
