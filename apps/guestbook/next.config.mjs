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
  experimental: {
    // Increase the body size limit to 50MB for video uploads
    bodySizeLimit: '50mb',
  },
};

export default nextConfig;
