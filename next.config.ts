import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/playground",
      headers: [{
        key: "Content-Security-Policy",
        // No allow-same-origin: evaluated code cannot read first-party storage,
        // cookies or DOM. Block network exfiltration from the playground.
        value: "sandbox allow-scripts; connect-src 'none'; img-src 'self' blob: data:; media-src 'self' blob: data:; form-action 'none'; base-uri 'none'; object-src 'none'",
      }],
    }];
  },
};

export default nextConfig;
