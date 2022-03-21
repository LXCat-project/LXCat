/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  images: {
    domains: ['s.gravatar.com', 'secure.gravatar.com'],
  },
}

module.exports = nextConfig
