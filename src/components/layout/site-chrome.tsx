"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";

/**
 * Renders the full site chrome (Header, Footer, consent banner) on normal
 * pages, but renders NOTHING on /embed/* routes so the embeddable calculator
 * shows in minimal chrome inside an iframe. The page content itself is rendered
 * by the layout as {children}; this component only adds/omits the surrounding
 * chrome based on the current path.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Only the embeddable calculator routes (/embed/<state>/<slug>) render bare;
  // the /embed documentation index keeps full chrome.
  const isEmbedFrame = Boolean(pathname && /^\/embed\/.+/.test(pathname));

  if (isEmbedFrame) {
    return <main id="main-content" className="flex-1">{children}</main>;
  }

  return (
    <>
      <Header />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer />
      <CookieConsentBanner />
    </>
  );
}
