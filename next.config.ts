import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports for Netlify
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https', 
        hostname: 'tokens.1inch.io',
      },
      {
        protocol: 'https',
        hostname: 'img.fotofolio.xyz',
      },
      {
        protocol: 'https',
        hostname: '**',
      }
    ]
  },
  // Disable server-side features for static export
  experimental: {
    esmExternals: true
  }
};

export default nextConfig;
