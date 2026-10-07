import type { NextConfig } from "next";

// K13-R: literal constants only (no env branch, no fetch directives); a nonce policy would make every ad page dynamic.
const PAGE_CSP = "object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const EMBED_CSP = "object-src 'none'; base-uri 'none'; frame-ancestors *";

const commonHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const pageHeaders = [
  ...commonHeaders,
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: PAGE_CSP },
];

const embedHeaders = [...commonHeaders, { key: "Content-Security-Policy", value: EMBED_CSP }];

const nextConfig: NextConfig = {
  // Cap static-page-generation workers.
  // With 420 SSG pages (50 states × 8 categories + marketing pages), Next.js
  // defaults to (cpus - 1) parallel workers (e.g. 11 on a 12-core box). Each
  // worker holds ~500MB of React/Next state, so peak RSS balloons past 5GB and
  // OOMs builds on memory-constrained CI or dev machines. 4 workers still
  // parallelizes generation enough while keeping peak usage ~2GB.
  experimental: {
    cpus: 4,
  },
  // Next classifies a route file named favicon.ico as static metadata, so the generated icon is served by rewrite.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/icon" }];
  },
  async headers() {
    // Every path must match exactly one rule: Next merges all matching rules and cannot drop a header.
    return [
      {
        source: "/embed/:path+",
        headers: embedHeaders,
      },
      {
        source: "/:path((?!embed/).*)",
        headers: pageHeaders,
      },
    ];
  },
};

export default nextConfig;
