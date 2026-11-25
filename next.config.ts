import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Local production and end-to-end checks use 127.0.0.1.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Server-side rendering and route handlers require the Node.js runtime.
  // Static-export-only deployment is intentionally not configured.
};

export default nextConfig;
