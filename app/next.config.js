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

// For local https disable cert checking
if (process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_URL.search(/^https:\/\/localhost/) > -1) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
}

module.exports = nextConfig
