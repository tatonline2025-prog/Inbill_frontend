import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Typecheck is executed separately in CI/local via `npx tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reduce worker fan-out to avoid EPERM process spawning issues on some Windows environments.
    cpus: 1,
  },
};

export default nextConfig;
