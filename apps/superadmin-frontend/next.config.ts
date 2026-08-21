import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NODE_ENV === "development" ? "dev-build" : ".next",
};

export default nextConfig;
