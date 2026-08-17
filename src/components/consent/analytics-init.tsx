"use client";

import { useEffect } from "react";
import {
  initHumanSessionSignal,
  initTrafficMarker,
  trackReferralSource,
} from "@/lib/analytics";

/**
 * Mounts once at the root layout to read the `?crew=1` / `?crew=0`
 * internal-traffic marker from the URL (see lib/analytics.ts
 * initTrafficMarker) so the owner's own visits are excluded from GA4 reports.
 *
 * Also fires the CODE-07 first-load referral classifier
 * (`trackReferralSource`), which tags AI-engine, embed-referral, and
 * directory/community referrer sessions via the same consent-gated
 * `trackEvent()` pipeline.
 *
 * Also arms the CODE-06/07 `human_session` engagement signal
 * (`initHumanSessionSignal`), which fires once per session on 25% scroll depth
 * or the first input interaction so data-center noise can be separated from
 * real readers in GA4 REPORTING. It never changes what is served — see the
 * cloaking warning in lib/analytics.ts. Renders nothing — side-effect only.
 */
export function AnalyticsInit() {
  useEffect(() => {
    initTrafficMarker();
    trackReferralSource();
    initHumanSessionSignal();
  }, []);

  return null;
}
