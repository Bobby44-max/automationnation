import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "my.spline.design",
      },
      {
        protocol: "https",
        hostname: "app.spline.design",
      },
    ],
  },
};

export default nextConfig;
