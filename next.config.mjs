/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.prod.whoop.com',
      },
    ],
  },
}

export default nextConfig
