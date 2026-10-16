/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? "dev-build" : ".next",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
