/**
 * /ads.txt — authorized digital sellers declaration.
 *
 * Default behaviour: serve the AdSense line from NEXT_PUBLIC_ADSENSE_CLIENT_ID.
 * Returns a comment-only body until configured, so an invalid placeholder is
 * never served to crawlers.
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

import { isSafeUrl } from "@/lib/utils/sanitize";

export function GET() {
  // Optional redirect — Ezoic/Raptive ads.txt manager URL.
  const redirectUrl = process.env.NEXT_PUBLIC_ADSTXT_REDIRECT_URL;
  if (redirectUrl && isSafeUrl(redirectUrl)) {
    return Response.redirect(redirectUrl, 301);
  }

  // Default: serve the AdSense line (or a comment when unset).
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  // Strip the optional "ca-" prefix: ads.txt requires "pub-XXXXXXXXXXXXXXXX".
  const body = client
    ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt — set NEXT_PUBLIC_ADSENSE_CLIENT_ID to declare your AdSense publisher ID\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
