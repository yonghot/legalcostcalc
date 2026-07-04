"use client";

import { useEffect } from "react";
import { initTrafficMarker, trackReferralSource } from "@/lib/analytics";

/**
 * Mounts once at the root layout to read the `?crew=1` / `?crew=0`
 * internal-traffic marker from the URL (see lib/analytics.ts
 * initTrafficMarker) so the owner's own visits are excluded from GA4 reports.
 *
 * Also fires the CODE-07 first-load referral classifier
 * (`trackReferralSource`), which tags AI-engine, embed-referral, and
 * directory/community referrer sessions via the same consent-gated
 * `trackEvent()` pipeline. Renders nothing — side-effect only.
 */
export function AnalyticsInit() {
  useEffect(() => {
    initTrafficMarker();
    trackReferralSource();
  }, []);

  return null;
}
