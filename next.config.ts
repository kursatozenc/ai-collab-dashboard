import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/ai-model-finder',
        destination: '/ai-model-finder/index.html',
      },
    ];
  },
};

export default nextConfig;
