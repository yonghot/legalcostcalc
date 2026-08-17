"use client";

/**
 * AdProvider — The SINGLE programmatic ad network selector.
 *
 * Reads NEXT_PUBLIC_AD_PROVIDER (adsense|ezoic|raptive|journey|none; default
 * adsense). Loads EXACTLY ONE provider:
 *   - adsense → reuses the existing <AdUnit> component (no second script tag)
 *   - ezoic   → a single <script> via NEXT_PUBLIC_EZOIC_SCRIPT_SRC
 *   - raptive → a single <script> via NEXT_PUBLIC_RAPTIVE_SITE_ID
 *   - journey → a single <script> via NEXT_PUBLIC_JOURNEY_SITE_ID (K10 —
 *     Journey by Mediavine, dormant premium-tier network; see 부속M §6. Not
 *     eligible until a site crosses ~1,000 real sessions/month — this wiring
 *     exists so the upgrade is a one-env-var flip, not a code change, once
 *     that trigger fires)
 *   - none / unset NEXT_PUBLIC_AD_PROVIDER → renders nothing
 *
 * NEVER loads two providers at once. All slots route through this component.
 *
 * CWV: the wrapper reserves min-height to prevent CLS.
 */

import { useEffect, useRef, useState } from "react";
import { AdUnit } from "@/components/ads/ad-unit";
import { parseAdProvider, type AdProvider as AdProviderType } from "@/lib/monetization";
import { resolveAdSlot } from "@/lib/ad-slots";

interface AdProviderProps {
  /** data-ad-slot for AdSense (ignored by other providers). */
  slot?: string;
  className?: string;
  /**
   * When true (default) the slot lazy-loads via IntersectionObserver.
   * Set false for above-fold placements.
   */
  lazy?: boolean;
}

/** Inject a script tag idempotently (checks src to avoid double-loading). */
function injectScript(src: string, attrs: Record<string, string> = {}) {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src="${src}"]`)) return;
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  document.head.appendChild(el);
}

/** Ezoic injection via NEXT_PUBLIC_EZOIC_SCRIPT_SRC. */
function EzoicSlot({ lazy }: { lazy: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(
    () => !lazy || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (!lazy || active) return;
    const node = wrapRef.current;
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
  }, [lazy, active]);

  useEffect(() => {
    if (!active) return;
    const src = process.env.NEXT_PUBLIC_EZOIC_SCRIPT_SRC;
    if (!src) return;
    injectScript(src);
  }, [active]);

  const src = process.env.NEXT_PUBLIC_EZOIC_SCRIPT_SRC;
  if (!src) return null;

  return (
    <div ref={wrapRef} className="min-h-[90px] sm:min-h-[250px]" aria-hidden="true">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Advertisement
      </p>
    </div>
  );
}

/** Raptive injection via NEXT_PUBLIC_RAPTIVE_SITE_ID. */
function RaptiveSlot({ lazy }: { lazy: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(
    () => !lazy || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (!lazy || active) return;
    const node = wrapRef.current;
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
  }, [lazy, active]);

  useEffect(() => {
    if (!active) return;
    const siteId = process.env.NEXT_PUBLIC_RAPTIVE_SITE_ID;
    if (!siteId) return;
    injectScript(
      `https://cdn.raptive.com/v1/${siteId}/ads.js`,
      { "data-raptive-site": siteId },
    );
  }, [active]);

  const siteId = process.env.NEXT_PUBLIC_RAPTIVE_SITE_ID;
  if (!siteId) return null;

  return (
    <div ref={wrapRef} className="min-h-[90px] sm:min-h-[250px]" aria-hidden="true">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Advertisement
      </p>
    </div>
  );
}

/** Journey by Mediavine injection via NEXT_PUBLIC_JOURNEY_SITE_ID (K10, dormant). */
function JourneySlot({ lazy }: { lazy: boolean }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(
    () => !lazy || typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    if (!lazy || active) return;
    const node = wrapRef.current;
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
  }, [lazy, active]);

  useEffect(() => {
    if (!active) return;
    const siteId = process.env.NEXT_PUBLIC_JOURNEY_SITE_ID;
    if (!siteId) return;
    // Journey (Mediavine) loader — standard head-script injection point,
    // Next.js-compatible per 부속M §6 verification (not a WordPress-only tag).
    injectScript(
      `https://journey.mediavine.com/${siteId}/journey.js`,
      { "data-journey-site": siteId },
    );
  }, [active]);

  const siteId = process.env.NEXT_PUBLIC_JOURNEY_SITE_ID;
  if (!siteId) return null;

  return (
    <div ref={wrapRef} className="min-h-[90px] sm:min-h-[250px]" aria-hidden="true">
      <p className="mb-1 text-center text-[10px] font-medium uppercase tracking-wide text-slate-400">
        Advertisement
      </p>
    </div>
  );
}

export function AdProvider({ slot, className, lazy = true }: AdProviderProps) {
  const provider: AdProviderType = parseAdProvider(
    process.env.NEXT_PUBLIC_AD_PROVIDER ?? null,
  );

  if (provider === "none") return null;

  if (provider === "ezoic") {
    const src = process.env.NEXT_PUBLIC_EZOIC_SCRIPT_SRC;
    if (!src) return null;
    return (
      <div className={className}>
        <EzoicSlot lazy={lazy} />
      </div>
    );
  }

  if (provider === "raptive") {
    const siteId = process.env.NEXT_PUBLIC_RAPTIVE_SITE_ID;
    if (!siteId) return null;
    return (
      <div className={className}>
        <RaptiveSlot lazy={lazy} />
      </div>
    );
  }

  if (provider === "journey") {
    const siteId = process.env.NEXT_PUBLIC_JOURNEY_SITE_ID;
    if (!siteId) return null;
    return (
      <div className={className}>
        <JourneySlot lazy={lazy} />
      </div>
    );
  }

  // Default: adsense — delegate entirely to the existing AdUnit component.
  // This means the AdSense script loaded by ConsentedAnalytics is the ONLY
  // programmatic tag ever injected — no second tag is added here.
  // CODE-01 (부속W): call sites (e.g. ResultMonetization) render
  // <AdProvider/> WITHOUT a slot prop, so `slot` was always undefined and the
  // manual unit could never carry a data-ad-slot. Resolve it here from the
  // canonical NEXT_PUBLIC_ADSENSE_SLOT_ID (validated numeric) so setting that
  // one env var makes this repo's units renderable, exactly as in the sibling
  // repos. An explicit prop still wins.
  return <AdUnit slot={resolveAdSlot("result", slot)} className={className} lazy={lazy} />;
}
