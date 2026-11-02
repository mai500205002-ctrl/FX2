const backend = (process.env.FX_BACKEND_URL || 'http://127.0.0.1:4002').replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  images: { unoptimized: true },
  // Same-origin proxy to the Express backend: no CORS, backend stays on 127.0.0.1.
  async rewrites() {
    return [
      { source: '/fx-api/:path*', destination: `${backend}/api/:path*` },
      { source: '/healthz', destination: `${backend}/healthz` },
    ]
  },
}
export default nextConfig
