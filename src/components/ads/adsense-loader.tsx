"use client";

import { usePathname } from "next/navigation";
import { isAdEligiblePath, type AdEligibilityRules } from "@/lib/ad-eligibility";

const LOADER_ORIGIN = "https://pagead2.googlesyndication.com";

// An onLoad handler keeps React 19 from hoisting this async script above the inline Consent Mode defaults in <head>.
function noop() {}

export function AdsenseLoader({ client, rules }: { client: string; rules: AdEligibilityRules }) {
  const pathname = usePathname();
  if (!pathname || !isAdEligiblePath(pathname, rules)) return null;
  return (
    <>
      <link rel="preconnect" href={LOADER_ORIGIN} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://googleads.g.doubleclick.net" />
      <script
        id="adsense-loader"
        async
        crossOrigin="anonymous"
        src={`${LOADER_ORIGIN}/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`}
        onLoad={noop}
      />
    </>
  );
}
