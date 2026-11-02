/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  // Same-origin proxy to the TextFX backend (Express, default port 4002) — avoids CORS.
  async rewrites() {
    const backend = (process.env.FX_BACKEND_URL || 'http://127.0.0.1:4002').replace(/\/$/, '')
    return [{ source: '/fx-api/:path*', destination: `${backend}/api/:path*` }]
  },
}
export default nextConfig
