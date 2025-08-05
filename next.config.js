/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@supabase/supabase-js']
  },
  images: {
    domains: [
      'fgcefqowzkpeivpckljf.supabase.co', // Supabase storage
      'lh3.googleusercontent.com', // Google profile images
      'avatars.githubusercontent.com' // GitHub avatars
    ],
    formats: ['image/webp', 'image/avif']
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
    NEXT_PUBLIC_APP_NAME: 'Spark MVP'
  },
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options', 
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  // Redirects for better UX
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/',
        permanent: false
      },
      {
        source: '/login',
        destination: '/auth/login', 
        permanent: true
      },
      {
        source: '/signup',
        destination: '/auth/signup',
        permanent: true
      }
    ]
  },
  // Performance optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true
}

module.exports = nextConfig
