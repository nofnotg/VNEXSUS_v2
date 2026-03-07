import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@vnexus/domain", "@vnexus/shared"]
};

export default nextConfig;
