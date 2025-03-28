/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sagafit.blob.core.windows.net',
        pathname: '**',
      },
      // Add your other patterns here
    ],
    // Add this to disable image optimization for Azure Blob Storage
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Only apply these polyfills on the client side
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
        os: false,
        path: false,
        zlib: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
