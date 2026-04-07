/** @type {import('next').NextConfig} */
const nextConfig = {
  // Cloudflare Pages: next-on-pages が Edge Runtime を要求する
  // ローカル開発時は無効
  ...(process.env.CF_PAGES ? { output: 'export' } : {}),
  images: {
    unoptimized: true,
  },
  ...(!process.env.CF_PAGES
    ? {
        async rewrites() {
          return [
            {
              source: '/api/v1/:path*',
              destination: `${process.env.API_URL ?? 'http://localhost:3001'}/api/v1/:path*`,
            },
          ]
        },
      }
    : {}),
}

export default nextConfig
