/** @type {import('next').NextConfig} */
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/app/i18n/request.ts');

const nextConfig = {
  // App router uses a different i18n approach
  // Removing the old i18n config
  
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Add image configuration - optimized for performance
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Reescribir rutas: crucial para arreglar el problema de i18n con imágenes
  async rewrites() {
    return [
      // Reescribir cualquier URL que comience con /en/logo.png, /es/logo.png o /de/logo.png a /logo.png
      {
        source: '/:locale(en|es|de)/logo.png',
        destination: '/logo.png',
      },
      // Regla genérica para cualquier imagen con locale
      {
        source: '/:locale(en|es|de)/:path*.png',
        destination: '/:path*.png',
      },
      {
        source: '/:locale(en|es|de)/:path*.jpg',
        destination: '/:path*.jpg',
      },
      {
        source: '/:locale(en|es|de)/:path*.svg',
        destination: '/:path*.svg',
      },
      {
        source: '/:locale(en|es|de)/:path*.webp',
        destination: '/:path*.webp',
      },
      // Reglas para archivos de video optimizadas
      {
        source: '/:locale(en|es|de)/:path*.mp4',
        destination: '/:path*.mp4',
      },
      {
        source: '/:locale(en|es|de)/videos/:file*.mp4',
        destination: '/videos/:file*.mp4',
      },
      {
        source: '/:locale(en|es|de)/:path*.webm',
        destination: '/:path*.webm',
      },
      {
        source: '/:locale(en|es|de)/:path*.ogg',
        destination: '/:path*.ogg',
      },
    ];
  },
  
  // Optimized headers for ultra-fast loading
  async headers() {
    return [
      {
        source: '/:path((?!_next|api).*)', // Todas las rutas excepto las que empiezan con _next o api
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      // Ultra-optimized caching for video files with streaming support
      {
        source: '/api/media/download',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800, must-revalidate', // 1 day cache, 1 week stale
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes', // Enable range requests for video streaming
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Allow cross-origin requests for video
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Range, Content-Range, Content-Length, Accept-Encoding',
          },
          {
            key: 'Access-Control-Expose-Headers',
            value: 'Content-Range, Content-Length, Accept-Ranges',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding, Range',
          },
        ],
      },
      // Aggressive caching for video files served directly
      {
        source: '/:path*.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable, stale-while-revalidate=86400', // 30 days cache
          },
          {
            key: 'Accept-Ranges',
            value: 'bytes',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      // Optimized image caching
      {
        source: '/:path*.(jpg|jpeg|png|gif|webp|avif|svg|ico)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
      // Preload hints for critical resources
      {
        source: '/:path*',
        headers: [
          {
            key: 'Link',
            value: '</api/media/download>; rel=preconnect; crossorigin, </_next/static>; rel=preconnect',
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
        ],
      },
      // Service Worker and PWA support
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },
  
  // Advanced experimental features for performance
  experimental: {
    // Enable modern bundling for better performance
    optimizePackageImports: ['framer-motion', 'lucide-react', '@heroicons/react'],
    // Enable server components optimization
    // Disable optimized CSS loading to fix prerendering issues
    // optimizeCss: true,
    // Enable turbo mode for faster builds
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },

    // Disable React compiler to fix prerendering issues
    // reactCompiler: true,
  },
  
  // Optimized webpack configuration for video and performance
  webpack: (config, { dev, isServer }) => {
    // Add support for video files with advanced optimization
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/videos/',
          outputPath: 'static/videos/',
          name: '[name].[contenthash].[ext]',
          // Enable compression for video files
          compress: true,
          // Optimize for streaming
          esModule: false,
        },
      },
    });

    // Add optimization for video streaming and caching
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          videos: {
            test: /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/,
            name: 'videos',
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Optimize critical libraries
          vendor: {
            test: /[\\/]node_modules[\\/](react|react-dom|framer-motion)[\\/]/,
            name: 'vendor',
            chunks: 'all',
            priority: 20,
          },
          // Optimize UI components
          ui: {
            test: /[\\/]node_modules[\\/](@heroicons|lucide-react)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 15,
          },
        },
      },
    };

    // Enable video preloading and caching
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        '@/videos': './public/videos',
        '@/images': './public/images',
      },
    };

    // Add performance optimizations
    if (!dev && !isServer) {
      // Enable tree shaking for better bundle size
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
      
      // Enable module concatenation
      config.optimization.concatenateModules = true;
      
      // Optimize chunks for better caching
      config.optimization.runtimeChunk = 'single';
      config.optimization.moduleIds = 'deterministic';
      config.optimization.chunkIds = 'deterministic';
    }



    return config;
  },


  // Output configuration for better performance
  output: 'standalone',
  
  // Enable compression
  compress: true,
  
  // Optimize power consumption
  poweredByHeader: false,
  
  // Enable strict mode for better performance
  reactStrictMode: true,
  
  // Optimize bundle analyzer
  ...(process.env.ANALYZE === 'true' && {
    bundleAnalyzer: {
      enabled: true,
      openAnalyzer: true,
    },
  }),
};

export default withNextIntl(nextConfig); 