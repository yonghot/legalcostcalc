import type { NextConfig } from "next";

// Google AdSense needs several Google/DoubleClick origins allowlisted in the CSP.
// We only widen the policy when AdSense is actually configured, so the default
// (no-AdSense) build keeps the tighter policy.
const adsenseEnabled = Boolean(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID);

// Google Analytics 4 (gtag.js) needs googletagmanager.com in script-src and
// google-analytics.com in connect-src.  We only widen the policy when a GA
// measurement ID is configured, mirroring the AdSense gating above.
const gaEnabled = Boolean(process.env.NEXT_PUBLIC_GA_ID);

const adScript = adsenseEnabled
  ? " https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://adservice.google.com https://www.googletagservices.com https://*.google.com https://*.doubleclick.net"
  : "";
const adFrame = adsenseEnabled
  ? "https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com"
  : "";
const adImg = adsenseEnabled
  ? " https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com"
  : "";
const adConnect = adsenseEnabled
  ? " https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net"
  : "";

// GA4 / gtag.js CSP additions (only when NEXT_PUBLIC_GA_ID is set).
const gaScript = gaEnabled
  ? " https://www.googletagmanager.com"
  : "";
const gaConnect = gaEnabled
  ? " https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com"
  : "";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
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
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${adScript}${gaScript}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data:${adImg}`,
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src 'self' https://*.supabase.co${adConnect}${gaConnect}`,
      ...(adFrame ? [`frame-src ${adFrame}`] : []),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

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
  async headers() {
    // /embed/* must be loadable inside third-party iframes, so it overrides the
    // global X-Frame-Options / frame-ancestors lockdown. Everything else keeps
    // the strict no-framing policy. We list the embed rule FIRST and exclude
    // /embed from the catch-all so the relaxed framing policy wins for embeds.
    const embedSecurityHeaders = securityHeaders.map((h) => {
      if (h.key === "X-Frame-Options") {
        // Drop the legacy header for embeds (allow framing anywhere).
        return { key: "X-Frame-Options", value: "ALLOWALL" };
      }
      if (h.key === "Content-Security-Policy") {
        return {
          key: "Content-Security-Policy",
          value: h.value.replace(
            "frame-ancestors 'none'",
            "frame-ancestors *",
          ),
        };
      }
      return h;
    });

    return [
      {
        source: "/embed/:path*",
        headers: embedSecurityHeaders,
      },
      {
        // Catch-all for every non-embed route.
        source: "/((?!embed).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
