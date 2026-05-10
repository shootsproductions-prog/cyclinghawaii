import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.mapbox.com" },
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "dgtzuqphqg23d.cloudfront.net" },
      { protocol: "https", hostname: "d35tn3x5zm6xrc.cloudfront.net" },
    ],
  },
};

export default nextConfig;
