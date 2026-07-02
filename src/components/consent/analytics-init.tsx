"use client";

import { useEffect } from "react";
import { initTrafficMarker } from "@/lib/analytics";

/**
 * Mounts once at the root layout to read the `?crew=1` / `?crew=0`
 * internal-traffic marker from the URL (see lib/analytics.ts
 * initTrafficMarker) so the owner's own visits are excluded from GA4 reports.
 * Renders nothing — side-effect only.
 */
export function AnalyticsInit() {
  useEffect(() => {
    initTrafficMarker();
  }, []);

  return null;
}
