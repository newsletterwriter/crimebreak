import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Add your image host here once known, e.g.:
      // { protocol: "https", hostname: "your-image-host.com" }
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
