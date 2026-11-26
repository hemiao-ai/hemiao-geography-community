import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  async redirects() {
    return [
      { source: "/", destination: "/home", permanent: false },
      { source: "/learn/earth", destination: "/learn/rj-g7a/c1s3", permanent: true },
      { source: "/learn/contour", destination: "/learn/rj-g7a/c2s2", permanent: true },
    ];
  },
  turbopack: {
    rules: {
      "*.css": { loaders: ["@tailwindcss/turbopack"], as: "*.css" },
    },
  },
};

export default nextConfig;
