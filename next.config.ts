import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/model-scout',
        destination: '/model-scout/index.html',
      },
    ];
  },
};

export default nextConfig;
