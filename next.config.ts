import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // photos are pre-encoded at build time (scripts/optimize-images.mjs): the on-demand
    // optimizer took 1 to 2.5 s per size on a cold cache, and every deploy starts cold
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
  },
  async headers() {
    // content-hashed file names, so they never change: cache for a year
    return [{ source: "/_img/:file*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
