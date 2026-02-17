// SPDX-FileCopyrightText: LXCat team
//
// SPDX-License-Identifier: AGPL-3.0-or-later

import NextBundleAnalyzer from "@next/bundle-analyzer";
import dotenv from "dotenv";

if (process.env.LXCAT_BUILD_ENV !== "production") {
  dotenv.config({ path: "../.env.development" });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  experimental: {
    optimizePackageImports: ["@mantine/core", "@mantine/hooks"],
    swcPlugins: process.env.CI && [
      ["swc-plugin-coverage-instrument", {}],
    ]
  },

  transpilePackages: ["next-mdx-remote"],

  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "nodejs") {
      config.module.rules = [
        ...config.module.rules,
        {
          test: /\.node$/,
          loader: "@lxcat/node-loader",
        },
      ];
    }
    if (process.env.CI) {
      config.devtool = "source-map";
    }
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
