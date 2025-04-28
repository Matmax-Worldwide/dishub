/** @type {import('next').NextConfig} */
const nextConfig = {
  // App router uses a different i18n approach
  // Removing the old i18n config
  
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Add image configuration
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [],
  },
};

export default nextConfig; 