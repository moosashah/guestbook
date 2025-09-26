/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['wedding-pwa-media.s3.amazonaws.com'],
    unoptimized: true,
  },
}

export default nextConfig