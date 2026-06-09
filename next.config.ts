import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  // Cross-origin isolation is required for SharedArrayBuffer, which the
  // in-browser code runtime uses for blocking stdin (input()/cin/prompt).
  // `credentialless` is used for COEP so cross-origin subresources (the
  // external banner image, Vercel analytics) keep loading without needing
  // CORP headers.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
        ],
      },
    ];
  },
};

export default nextConfig;
