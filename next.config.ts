import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Help page reads the user manual from docs/ when it runs on Vercel.
  outputFileTracingIncludes: { "/help": ["./docs/user-manual.md"] },
};

export default nextConfig;
