import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["satellite.js"],
  devIndicators: false,
};

export default nextConfig;