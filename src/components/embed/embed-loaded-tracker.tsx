"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Fires `embed_loaded` once per widget mount, inside the embed iframe bundle
 * itself. Reads document.referrer (the PARENT page's origin, i.e. the
 * partner site hosting the iframe) to attribute the host domain — never
 * tracks the host page's users beyond this single mount event, and never
 * loads AdSense (the embed route intentionally omits ads entirely).
 */
export function EmbedLoadedTracker() {
  useEffect(() => {
    let hostDomain = "unknown";
    try {
      hostDomain = document.referrer
        ? new URL(document.referrer).hostname
        : "unknown";
    } catch {
      hostDomain = "unknown";
    }
    trackEvent("embed_loaded", { host_domain: hostDomain });
  }, []);

  return null;
}
