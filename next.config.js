/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  swcMinify: true,
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['ai', '@ai-sdk/openai'],
  },
  async headers() {
    return [
      {
        // Ne jamais cacher sw.js et version.json
        source: '/:path(sw\\.js|version\\.json)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
