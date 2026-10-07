/**
 * /ads.txt — authorized digital sellers declaration.
 *
 * Default behaviour: serve the AdSense line for the id resolved by
 * resolveAdsenseClient() (NEXT_PUBLIC_ADSENSE_CLIENT_ID, else the public
 * publisher id), so the body is never a comment-only placeholder.
 *
 * Optional redirect: when NEXT_PUBLIC_ADSTXT_REDIRECT_URL is set the route
 * issues a 301 to that URL. This supports Ezoic/Raptive ads.txt managers
 * without removing the AdSense fallback — the AdSense line is preserved in the
 * default (non-redirect) path.
 *
 * ads.txt format: "google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0"
 * Note: ads.txt uses the "pub-…" form (no "ca-" prefix).
 *
 * Format ref: https://support.google.com/adsense/answer/12171612
 */
export const dynamic = "force-dynamic";

import { resolveAdsenseClient } from "@/lib/env";
import { isSafeUrl } from "@/lib/utils/sanitize";

export function GET() {
  // Optional redirect — Ezoic/Raptive ads.txt manager URL.
  const redirectUrl = process.env.NEXT_PUBLIC_ADSTXT_REDIRECT_URL;
  if (redirectUrl && isSafeUrl(redirectUrl)) {
    return Response.redirect(redirectUrl, 301);
  }

  // Strip the "ca-" prefix: ads.txt requires "pub-XXXXXXXXXXXXXXXX".
  const publisher = resolveAdsenseClient().replace(/^ca-/, "");
  const body = `google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
