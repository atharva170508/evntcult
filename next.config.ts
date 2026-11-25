import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` use the D1 / Durable Object bindings from wrangler.jsonc (local simulation).
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}

const CSP_BASE = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.googleapis.com",
  "connect-src 'self' https://maps.googleapis.com",
  "worker-src 'self' blob:",
].join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Add your media CDN / S3 bucket host here for the Photo Vault.
    remotePatterns: [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        ],
      },
      // Every page refuses to be framed and enforces strict CSP, except /embed/* for club embeds.
      {
        source: "/((?!embed/).*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: `${CSP_BASE}; frame-ancestors 'none'` },
        ],
      },
      {
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: `${CSP_BASE}; frame-ancestors *` }],
      },
    ];
  },
};

export default nextConfig;
