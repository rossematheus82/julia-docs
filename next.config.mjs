/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['pdf-lib'],
  },
  env: {
    TZ: 'America/Sao_Paulo',
  },
}

export default nextConfig
