import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Map Neon's fixed env var to what the auth library expects
    NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEON_AUTH_BASE_URL,
  },
};

export default nextConfig;
