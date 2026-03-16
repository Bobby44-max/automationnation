import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/schedule",
        destination: "/scheduling/weather",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
