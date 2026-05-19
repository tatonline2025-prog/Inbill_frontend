import type { NextConfig } from "next";

const defaultBackendOrigin = process.env.NODE_ENV === "production"
  ? "http://103.200.20.7:3000"
  : "http://localhost:3000";

const backendOrigin = process.env.BACKEND_ORIGIN || defaultBackendOrigin;

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
