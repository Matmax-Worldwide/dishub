// packages/tenant-site-template/next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Environment variables that need to be available to the browser
  env: {
    NEXT_PUBLIC_TENANT_ID: process.env.TENANT_ID || '',
    NEXT_PUBLIC_CMS_GRAPHQL_URL: process.env.CMS_GRAPHQL_URL || '',
  },
  // If using ISR, you might configure revalidate times here or per page
  // output: 'export', // For fully static export if not using ISR/SSR features needing a server
};

export default nextConfig;
