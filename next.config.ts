import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "*.github.dev", "*.app.github.dev"],
};

export default nextConfig;
