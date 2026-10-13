import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/playground",
      headers: [{
        key: "Content-Security-Policy",
        // No allow-same-origin: evaluated code cannot read first-party storage,
        // cookies or DOM. Block network exfiltration from the playground.
        value: "sandbox allow-scripts; connect-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'",
      }],
    }];
  },
};

export default nextConfig;
