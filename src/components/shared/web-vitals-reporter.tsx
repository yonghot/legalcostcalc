"use client";

/**
 * T13 — Web Vitals -> GA4 events.
 *
 * Mounted once in the root layout. Reports Core Web Vitals (LCP, CLS, INP)
 * through the SAME consent-gated trackEvent() pipeline as every other event
 * in this repo — no new script tag, no bypass of the T01 hostname gate or
 * Consent Mode. `web_vitals` is a no-op call when `window.gtag` isn't a
 * function yet (pre-consent / GA not loaded on this deploy), matching every
 * other trackEvent() call site.
 */

import { useEffect } from "react";
import { onCLS, onINP, onLCP, type Metric } from "web-vitals";
import { trackEvent } from "@/lib/analytics";

function reportMetric(metric: Metric): void {
  trackEvent("web_vitals", {
    metric_name: metric.name,
    metric_value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
    metric_rating: metric.rating,
    metric_id: metric.id,
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    onLCP(reportMetric);
    onCLS(reportMetric);
    onINP(reportMetric);
  }, []);

  return null;
}
