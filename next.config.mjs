/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  // App router uses a different i18n approach
  // Removing the old i18n config
  
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Add image configuration - desactivar optimización para imágenes estáticas
  images: {
    unoptimized: true,
  },
  
  // Reescribir rutas: crucial para arreglar el problema de i18n con imágenes
  async rewrites() {
    return [
      // Reescribir cualquier URL que comience con /en/logo.png o /es/logo.png a /logo.png
      {
        source: '/:locale(en|es)/logo.png',
        destination: '/logo.png',
      },
      // Regla genérica para cualquier imagen con locale
      {
        source: '/:locale(en|es)/:path*.png',
        destination: '/:path*.png',
      },
      {
        source: '/:locale(en|es)/:path*.jpg',
        destination: '/:path*.jpg',
      },
      {
        source: '/:locale(en|es)/:path*.svg',
        destination: '/:path*.svg',
      },
      {
        source: '/:locale(en|es)/:path*.webp',
        destination: '/:path*.webp',
      },
      // Reglas para archivos de video
      {
        source: '/:locale(en|es)/:path*.mp4',
        destination: '/:path*.mp4',
      },
      {
        source: '/:locale(en|es)/videos/:file*.mp4',
        destination: '/videos/:file*.mp4',
      },
    ];
  },
  
  // Asegurarse de que los assets estáticos tengan el cache correcto
  async headers() {
    return [
      {
        source: '/:path((?!_next|api).*)', // Todas las rutas excepto las que empiezan con _next o api
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Optimized caching for video files
      {
        source: '/api/media/download',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800', // 1 day cache, 1 week stale
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes', // Enable range requests for video streaming
          },
        ],
      },
      // Cache video files served directly
      {
        source: '/:path*.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, immutable', // 1 week cache for video files
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
        ],
      },
    ];
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable modern bundling for better performance
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  
  // Webpack configuration for video optimization
  webpack: (config) => {
    // Add support for video files in webpack
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/videos/',
          outputPath: 'static/videos/',
          name: '[name].[hash].[ext]',
        },
      },
    });

    return config;
  },
};

export default withNextIntl(nextConfig); 