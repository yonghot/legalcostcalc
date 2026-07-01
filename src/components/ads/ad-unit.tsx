"use client";

import { useEffect, useRef, useState } from "react";

interface AdUnitProps {
  /** data-ad-slot value from your AdSense dashboard (per ad unit). */
  slot?: string;
  /** AdSense format: "auto" (responsive), "fluid", "rectangle", etc. */
  format?: string;
  responsive?: boolean;
  className?: string;
  /**
   * When true (default) the slot is lazy-activated via IntersectionObserver
   * (~400px rootMargin) — use for below-the-fold ads. Set false for
   * above-the-fold slots that should request eagerly.
   */
  lazy?: boolean;
}

declare global {
  interface Window {
    adsbygoogle?: Record<string, unknown>[];
  }
}

/**
 * A single AdSense display unit. Renders an inert labelled placeholder unless
 * NEXT_PUBLIC_ADSENSE_CLIENT_ID is set, so the app is safe to ship before
 * AdSense approval.
 *
 * CWV notes:
 *  - The live <ins> wrapper reserves vertical space (min-h) matching the
 *    placeholder to prevent CLS when the ad fills.
 *  - The (window.adsbygoogle = window.adsbygoogle || []).push({}) call only runs
 *    after the loader <script> is present, and the array is initialised before
 *    the push.
 *  - Below-the-fold slots are lazy-activated with an IntersectionObserver
 *    (rootMargin ~400px); above-the-fold slots pass lazy={false}.
 *
 * AdSense policy: ads must be clearly distinguishable from content and must NOT
 * sit immediately adjacent to the cost figures or the legal disclaimer in a way
 * that invites accidental clicks. Keep the "Advertisement" label.
 */
export function AdUnit({
  slot,
  format = "auto",
  responsive = true,
  className,
  lazy = true,
}: AdUnitProps) {
  const rawClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  // Normalise to "ca-pub-…" form regardless of whether the env value includes the prefix.
  const client = rawClient
    ? rawClient.startsWith("ca-")
      ? rawClient
      : `ca-${rawClient}`
    : null;

  const insRef = useRef<HTMLModElement>(null);
  // Eager slots (or environments without IntersectionObserver) activate
  // immediately; lazy slots wait for the observer to fire.
  const [active, setActive] = useState(
    () =>
      !lazy ||
      (typeof IntersectionObserver === "undefined" &&
        typeof window !== "undefined"),
  );

  // Lazy activation: arm an IntersectionObserver on the wrapper.
  useEffect(() => {
    if (!client || !lazy || active) return;
    const node = insRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [client, lazy, active]);

  // Push the ad request once active AND the loader script is present.
  useEffect(() => {
    if (!client || !active) return;

    // Only push after the adsbygoogle loader script has been injected
    // (ConsentedAnalytics injects it env-guarded). Initialise the array first,
    // then push — fixes the ordering so the queue is never undefined.
    const loaderPresent = document.querySelector(
      'script[src*="adsbygoogle.js"]',
    );
    if (!loaderPresent) return;

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch {
      // adsbygoogle not ready yet; the script retries on its own.
    }
  }, [client, active]);

  if (!client) {
    // Inert placeholder — visible only in development/preview when the env var
    // is unset. Does not cause layout shift because it has a fixed min-height.
    return (
      <div
        className={`flex min-h-[100px] items-center justify-center rounded-md border border-dashed border-slate-200 bg-slate-50 sm:min-h-[280px] ${className ?? ""}`}
        aria-hidden="true"
        role="presentation"
      >
        <p className="text-[10px] font-medium uppercase tracking-wide text-slate-300">
          Ad placeholder — set NEXT_PUBLIC_ADSENSE_CLIENT_ID to enable
        </p>
      </div>
    );
  }

  return (
    <div className={className} aria-hidden="true">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Advertisement
      </p>
      {/* Reserve space (min-h) matching the placeholder to prevent CLS. */}
      <ins
        ref={insRef}
        className="adsbygoogle block min-h-[100px] sm:min-h-[280px]"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
