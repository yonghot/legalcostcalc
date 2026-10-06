import { resolveAdsenseClient } from "@/lib/env";

const LOADER_ORIGIN = "https://pagead2.googlesyndication.com";

export function AdsenseLoader() {
  const client = encodeURIComponent(resolveAdsenseClient());
  // A raw <script async src> element would be hoisted into <head> ahead of the inline Consent Mode defaults; an HTML string is not.
  const loader = `<script id="adsense-loader" async crossorigin="anonymous" src="${LOADER_ORIGIN}/pagead/js/adsbygoogle.js?client=${client}"></script>`;
  return (
    <>
      <link rel="preconnect" href={LOADER_ORIGIN} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
      <div hidden dangerouslySetInnerHTML={{ __html: loader }} />
    </>
  );
}
