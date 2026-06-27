/**
 * /ads.txt — authorized digital sellers declaration for AdSense.
 *
 * Generated from NEXT_PUBLIC_ADSENSE_CLIENT (ca-pub-XXXXXXXXXXXXXXXX) so there is
 * no hard-coded publisher ID. Returns 204 (no content) until configured, so an
 * invalid placeholder is never served to crawlers.
 *
 * Format ref: https://support.google.com/adsense/answer/12171612
 */
export const dynamic = "force-static";

export function GET() {
  const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  // ca-pub-1234 -> pub-1234 (ads.txt uses the publisher account ID without "ca-")
  const body = client
    ? `google.com, ${client.replace(/^ca-/, "")}, DIRECT, f08c47fec0942fa0\n`
    : "# ads.txt — set NEXT_PUBLIC_ADSENSE_CLIENT to declare your AdSense publisher ID\n";
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
