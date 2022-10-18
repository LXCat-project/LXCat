/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental: {
  //   outputStandalone: true,
  // },
  webpack: (config, { nextRuntime }) => {
    if (nextRuntime === "nodejs") {
      config.module.rules = [
        ...config.module.rules,
        {
          test: /\.node$/,
          loader: "node-loader",
        },
      ];
    }
    return config;
  },
  images: {
    domains: ["s.gravatar.com", "secure.gravatar.com"],
  },
};

// For local https disable cert checking
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXTAUTH_URL.search(/^https:\/\/localhost/) > -1
) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
  openAnalyzer: false,
})
module.exports = withBundleAnalyzer(nextConfig)
