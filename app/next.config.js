// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import NextBundleAnalyzer from "@next/bundle-analyzer";
import dotenv from "dotenv";
import path from "path";

if (process.env.LXCAT_BUILD_ENV !== "production") {
  dotenv.config({ path: "../.env.development" });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
    swcPlugins: process.env.NEXT_ENABLE_COVERAGE && [
      ["swc-plugin-coverage-instrument", {}],
    ],
    useTypeScriptCli: true
  },

  transpilePackages: ["next-mdx-remote"],

  // @lxcat/converter is a native napi-rs addon (a .node binary). It can't be
  // bundled by either webpack or Turbopack, so it's opted out of Server
  // Components bundling here and loaded via plain Node `require` at runtime.
  serverExternalPackages: ["@lxcat/converter"],

  // The `@/*` alias below is only needed for the webpack fallback build
  // (`next build --webpack`); Turbopack picks up the same alias from
  // tsconfig.json's `paths` automatically. This empty config acknowledges
  // that the webpack customization below is intentional and not needed here.
  turbopack: {},

  productionBrowserSourceMaps: !!process.env.NEXT_ENABLE_COVERAGE,

  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(import.meta.dirname, "src");
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "s.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      }
    ],
  },
};

// For local https disable cert checking
if (
  process.env.NODE_ENV === "development"
  && process.env.NEXTAUTH_URL.search(/^https:\/\/localhost/) > -1
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const withBundleAnalyzer = NextBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
  openAnalyzer: false,
});

export default withBundleAnalyzer(nextConfig);
