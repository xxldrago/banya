const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // i18n configuration
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    localeDetection: {
      // Browser language detection
      browserLangDetector: {
        options: {
          // English detection patterns
          en: ['en-US', 'en-GB', 'en-AU', 'en-CA'],
          // Russian detection patterns
          ru: ['ru-RU', 'ru-UA', 'ru-KZ'],
        },
      },
      // Cookie-based preference
      cookie: {
        key: 'i18n-language',
        options: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 365 * 24 * 60 * 60, // 1 year
        },
      },
      // URL path detection
      path: {
        regions: [
          { reg: '/en/', lang: 'en' },
          { reg: '/ru/', lang: 'ru' },
        ],
        default: 'ru',
      },
    },
    loadLocaleOnDemand: true,
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-RateLimit-Limit',
            value: '100',
          },
          {
            key: 'X-RateLimit-Remaining',
            value: '99',
          },
          {
            key: 'X-RateLimit-Reset',
            value: '3600',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: true,
    scrollRestoration: true,
  },

  // Build optimization
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = './src';
    config.resolve.alias['@repo'] = './.repo';
    
    if (!isServer) {
      config.resolve.alias['@modules'] = './src/modules';
    }
    
    return config;
  },

  // Image optimization
  images: {
    domains: ['cdn.banya-sauna.ru', 'images.banya-sauna.ru'],
    formats: ['image/webp', 'image/avif'],
  },

  // Output configuration
  output: 'standalone',

  // Development server configuration
  devIndicators: {
    position: 'bottom-right',
    buildActivities: true,
    optimizePackageImports: true,
  },

  // Redirects for i18n
  async redirects() {
    return [
      {
        source: '/en',
        destination: '/en/',
        permanent: true,
      },
      {
        source: '/ru',
        destination: '/ru/',
        permanent: true,
      },
      {
        source: '/en/login',
        destination: '/en/auth/login',
        permanent: false,
      },
      {
        source: '/ru/login',
        destination: '/ru/auth/login',
        permanent: false,
      },
    ];
  },

  // Rewrites for i18n
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
      afterFiles: [
        {
          source: '/:path*/:slug*',
          destination: '/:path*/:slug*',
        },
      ],
      fallback: [
        {
          source: '/:path*/:slug*',
          destination: '/:path*/:slug*',
        },
      ],
    };
  },

  // Linting configuration
  eslint: {
    dirs: ['src', 'tests'],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Compression
  compress: true,

  // Production optimizations
  poweredByHeader: false,

  // Static export configuration
  // experimental: {
  //   appDir: true,
  // },
};
  // i18n configuration
  i18n: {
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    localeDetection: {
      // Browser language detection
      browserLangDetector: {
        options: {
          // English detection patterns
          en: ['en-US', 'en-GB', 'en-AU', 'en-CA'],
          // Russian detection patterns
          ru: ['ru-RU', 'ru-UA', 'ru-KZ'],
        },
      },
      // Cookie-based preference
      cookie: {
        key: 'i18n-language',
        options: {
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          maxAge: 365 * 24 * 60 * 60, // 1 year
        },
      },
      // URL path detection
      path: {
        regions: [
          { reg: '/en/', lang: 'en' },
          { reg: '/ru/', lang: 'ru' },
        ],
        default: 'ru',
      },
    },
    loadLocaleOnDemand: true,
    loadPath: '/locales/{{lng}}/{{ns}}.json',
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-RateLimit-Limit',
            value: '100',
          },
          {
            key: 'X-RateLimit-Remaining',
            value: '99',
          },
          {
            key: 'X-RateLimit-Reset',
            value: '3600',
          },
        ],
      },
    ];
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: true,
    scrollRestoration: true,
  },

  // Build optimization
  webpack: (config, { isServer }) => {
    config.resolve.alias['@'] = './src';
    config.resolve.alias['@repo'] = './.repo';
    
    if (!isServer) {
      config.resolve.alias['@modules'] = './src/modules';
    }
    
    return config;
  },

  // Image optimization
  images: {
    domains: ['cdn.banya-sauna.ru', 'images.banya-sauna.ru'],
    formats: ['image/webp', 'image/avif'],
  },

  // Output configuration
  output: 'standalone',

  // Development server configuration
  devIndicators: {
    position: 'bottom-right',
    buildActivities: true,
    optimizePackageImports: true,
  },

  // Redirects for i18n
  async redirects() {
    return [
      {
        source: '/en',
        destination: '/en/',
        permanent: true,
      },
      {
        source: '/ru',
        destination: '/ru/',
        permanent: true,
      },
      {
        source: '/en/login',
        destination: '/en/auth/login',
        permanent: false,
      },
      {
        source: '/ru/login',
        destination: '/ru/auth/login',
        permanent: false,
      },
    ];
  },

  // Rewrites for i18n
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: '/api/:path*',
        },
      ],
      afterFiles: [
        {
          source: '/:path*/:slug*',
          destination: '/:path*/:slug*',
        },
      ],
      fallback: [
        {
          source: '/:path*/:slug*',
          destination: '/:path*/:slug*',
        },
      ],
    };
  },

  // Linting configuration
  eslint: {
    dirs: ['src', 'tests'],
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // Compression
  compress: true,

  // Production optimizations
  poweredByHeader: false,

  // Static export configuration
  // experimental: {
  //   appDir: true,
  // },
};

module.exports = withValue(nextConfig);