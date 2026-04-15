import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    // This automatically compresses your local /public images 
    // into the best format the user's browser supports.
  },
  trailingSlash: true, // or false, but be consistent
};

export default nextConfig;
