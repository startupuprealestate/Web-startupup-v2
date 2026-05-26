/** @type {import('next').NextConfig} */
const isDevelopment = process.env.NODE_ENV !== 'production';

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : "",
    "https://apis.google.com"
  ].filter(Boolean).join(' '),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  [
    "img-src",
    "'self'",
    "data:",
    "blob:",
    "https://res.cloudinary.com",
    "https://*.cloudinary.com",
    "https://images.unsplash.com",
    "https://img.youtube.com",
    "https://i.ytimg.com",
    "https://*.googleusercontent.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://*.basemaps.cartocdn.com",
    "https://placehold.co"
  ].join(' '),
  "media-src 'self' https://res.cloudinary.com https://*.cloudinary.com",
  [
    "connect-src",
    "'self'",
    "https://api.cloudinary.com",
    "https://*.cloudinary.com",
    "https://*.googleapis.com",
    "https://*.google.com",
    "https://*.gstatic.com",
    "https://raw.githubusercontent.com",
    "https://identitytoolkit.googleapis.com",
    "https://securetoken.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://firestore.googleapis.com",
    "https://www.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
    "wss://firestore.googleapis.com"
  ].join(' '),
  "frame-src 'self' https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://*.google.com https://accounts.google.com https://*.firebaseapp.com",
  "child-src 'self' https://www.youtube-nocookie.com https://www.google.com https://maps.google.com https://*.google.com https://accounts.google.com https://*.firebaseapp.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests"
].join('; ');

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: contentSecurityPolicy },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self), clipboard-write=(self)' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' }
        ],
      },
    ];
  },
};

export default nextConfig;
