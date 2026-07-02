"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

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
 * SPA re-init (T05): AdSense initializes only on a full page load — client-
 * side <Link> navigations otherwise leave this unit empty on the destination
 * page. `key={`${slot}-${pathname}`}` on the wrapper (applied by the parent
 * via `usePathname()`) forces a fresh mount per route; this component then
 * pushes exactly ONE ad request per mount (guarded by `data-ad-status`, which
 * AdSense sets to 'filled' or 'unfilled' once it has responded) with a single
 * 750ms retry if the slot is still unset. Never pushes a slot whose
 * data-ad-status is already 'filled'/'unfilled' (double-push throws and can
 * double-count) and never uses a timer-based refresh loop.
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

  const pathname = usePathname();
  const insRef = useRef<HTMLModElement>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Eager slots (or environments without IntersectionObserver) activate
  // immediately; lazy slots wait for the observer to fire.
  const [active, setActive] = useState(
    () =>
      !lazy ||
      (typeof IntersectionObserver === "undefined" &&
        typeof window !== "undefined"),
  );

  // Re-arm activation state on every route change so a client-side navigation
  // to a page reusing this same component instance (e.g. via a shared layout)
  // re-triggers the lazy-observe / eager-push flow below.
  useEffect(() => {
    setActive(
      !lazy ||
        (typeof IntersectionObserver === "undefined" &&
          typeof window !== "undefined"),
    );
    // Clear any pending retry from a previous route before re-arming.
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

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
  // Re-runs on pathname change (via the active-reset effect above), so a
  // client-side route change into a reused instance requests a fresh ad.
  useEffect(() => {
    if (!client || !active) return;

    const node = insRef.current;
    if (!node) return;

    // Never push a slot AdSense has already responded to — data-ad-status is
    // set to 'filled' or 'unfilled' once the request completes. Re-pushing a
    // resolved slot throws and can double-count impressions.
    const adStatus = node.getAttribute("data-ad-status");
    if (adStatus === "filled" || adStatus === "unfilled") return;

    // Only push after the adsbygoogle loader script has been injected
    // (ConsentedAnalytics injects it env-guarded). Initialise the array first,
    // then push — fixes the ordering so the queue is never undefined.
    const loaderPresent = document.querySelector(
      'script[src*="adsbygoogle.js"]',
    );
    if (!loaderPresent) return;

    const pushOnce = () => {
      const currentStatus = insRef.current?.getAttribute("data-ad-status");
      if (currentStatus === "filled" || currentStatus === "unfilled") return;
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // adsbygoogle not ready yet; the single retry below covers this.
      }
    };

    pushOnce();

    // Single 750ms retry ONLY if the slot is still unset after the first
    // push attempt (e.g. the loader script was still initializing). Never a
    // recurring/timer-based refresh.
    retryTimeoutRef.current = setTimeout(() => {
      const statusAfterFirstPush = insRef.current?.getAttribute("data-ad-status");
      if (statusAfterFirstPush === "filled" || statusAfterFirstPush === "unfilled") return;
      pushOnce();
    }, 750);

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [client, active, pathname]);

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
      {/* Reserve space (min-h) matching the placeholder to prevent CLS.
          key={`${slot}-${pathname}`} forces a fresh <ins> element per route
          so AdSense treats each destination page as a new ad request. */}
      <ins
        key={`${slot ?? "default"}-${pathname}`}
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
