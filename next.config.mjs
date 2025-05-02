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
    ];
  },
};

export default withNextIntl(nextConfig); 