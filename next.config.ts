import type { NextConfig } from "next";

const backendOrigin = process.env.BACKEND_ORIGIN || "http://localhost:3000";

const nextConfig: NextConfig = {
  typescript: {
    // Typecheck is executed separately in CI/local via `npx tsc --noEmit`.
    ignoreBuildErrors: true,
  },
  experimental: {
    // Reduce worker fan-out to avoid EPERM process spawning issues on some Windows environments.
    cpus: 1,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
