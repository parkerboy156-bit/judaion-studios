import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'objectstorage.af-johannesburg-1.oraclecloud.com',
        port: '',
        pathname: '/n/axqupand75tw/b/archive/o/**',
      },
    ],
  },
  trailingSlash: true,
};

export default nextConfig;