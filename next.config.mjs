import path from "node:path"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

// Which user agents get a *blocking* metadata render (metadata guaranteed inside
// <head>) rather than metadata streamed in behind the shell.
//
// This used to be /.*/ — every request blocked — which meant real browsers got
// no HTML at all until generateMetadata had finished its database work. On a
// cold cache that held the whole product document back behind the metadata
// queries, and the segment's loading.jsx could not paint either.
//
// Next's own default already covers every link-preview and HTML-limited crawler
// (Twitterbot, facebookexternalhit, Slackbot, WhatsApp, Bingbot, the -Google
// crawlers…). It deliberately omits the main Googlebot because that one renders
// JavaScript and reads streamed metadata fine — but this file previously opted
// Googlebot in on purpose, so we keep it in the blocking set and only let real
// browsers stream. If the internal list ever moves, fall back to the old
// block-everything behaviour: slower, never wrong.
const htmlLimitedBots = (() => {
    try {
        const { HTML_LIMITED_BOT_UA_RE } = createRequire(import.meta.url)(
            "next/dist/shared/lib/router/utils/html-bots.js"
        )
        return new RegExp(`${HTML_LIMITED_BOT_UA_RE.source}|Googlebot`, "i")
    } catch {
        return /.*/
    }
})()


// Content-Security-Policy scoped to the third parties this app actually uses:
// Razorpay checkout (script/frame/connect), Cloudinary images (res.cloudinary.com)
// and the Cloudinary Upload Widget used in the admin Media section. The widget
// injects a script from and renders inside an iframe on upload-widget.cloudinary.com,
// and uploads go to api.cloudinary.com — all three must be whitelisted or the
// "Upload Media" button does nothing. 'unsafe-inline' is required for Next.js'
// inline bootstrap/hydration scripts and inline style attributes; tightening to a
// nonce-based strict-dynamic CSP is a future step.
const contentSecurityPolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "img-src 'self' data: blob: https://res.cloudinary.com https://upload-widget.cloudinary.com https://*.razorpay.com",
    "media-src 'self' https://res.cloudinary.com",
    "font-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline' https://upload-widget.cloudinary.com https://checkout.razorpay.com https://*.razorpay.com",
    "connect-src 'self' https://api.cloudinary.com https://upload-widget.cloudinary.com https://*.razorpay.com https://lumberjack.razorpay.com",
    "frame-src 'self' https://upload-widget.cloudinary.com https://*.razorpay.com https://api.razorpay.com",
    "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
]

// These pages are useful to shoppers but must never become search results.
// The HTTP header covers client-rendered pages and redirect responses, while
// their route layouts also emit an HTML robots meta tag for crawler parity.
const privatePageHeaders = [
    '/admin/:path*',
    '/auth/:path*',
    '/cart',
    '/checkout/:path*',
    '/my-account/:path*',
    '/profile/:path*',
    '/orders/:path*',
    '/order-details/:path*',
].map((source) => ({
    source,
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
}))

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Allow an isolated build while the local development server is running.
    distDir: process.env.NEXT_DIST_DIR || '.next',
    compress: true,
    poweredByHeader: false,
    // react-pdf relies on native-ish deps (fontkit, yoga-layout wasm) that must not
    // be bundled — keep it external so it runs correctly in the Node server runtime.
    serverExternalPackages: ['@react-pdf/renderer'],
    // Crawlers block on metadata, browsers stream it — see the definition above.
    htmlLimitedBots,
    // The parent folder holds several projects. Pin the workspace root to this
    // app so a lockfile anywhere above it can't make Turbopack infer the wrong
    // root (which breaks module resolution and HMR caching).
    turbopack: {
        root: path.dirname(fileURLToPath(import.meta.url)),
    },
    experimental: {
        optimizePackageImports: ['lucide-react', 'gsap', '@gsap/react', 'react-icons', 'radix-ui'],
    },
    async headers() {
        return [
            {
                // Security headers on every route
                source: '/:path*',
                headers: securityHeaders,
            },
            {
                // Cache custom fonts for 1 year — they're content-addressed filenames
                source: '/assets/font/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
            },
            {
                // Cache hero and other static images for 1 year. The /_next/image
                // optimizer inherits this max-age for its output, so a short TTL here
                // is what made Lighthouse flag "inefficient cache lifetimes" on the
                // optimized hero/thumbnail URLs. stale-while-revalidate lets a renamed
                // asset refresh in the background without blocking the response.
                source: '/assets/images/:path*',
                headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, stale-while-revalidate=86400' }],
            },
            ...privatePageHeaders,
        ]
    },
    images: {
        qualities: [82],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60 * 60 * 24 * 365,
        deviceSizes: [320, 420, 640, 768, 1024, 1200, 1440, 1920],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'res.cloudinary.com',
                port: '',
                pathname: '/**',
                search: ''
            }
        ]
    }
};

export default nextConfig;
