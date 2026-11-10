/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },

  // Webpack aliases
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

  // Disable Next.js logo in build output
  poweredByHeader: false,
};

module.exports = nextConfig;
