"use client";

/**
 * ResultMonetization — Shared monetization stack inserted directly BELOW the
 * calculator result output (never above it — protects LCP).
 *
 * Fixed top-to-bottom order:
 *   (a) PrimaryIntentCTA   — call / cpl / affiliate / null
 *   (b) DisplaySlot        — single programmatic unit via <AdProvider>
 *   (c) AdvertiserDisclosure + FeaturedPartnerTable  — from MON_FEATURED_PARTNERS
 *   (d) SponsorSlot        — from NEXT_PUBLIC_SPONSOR_HTML or backfill URL
 *   (e) EmailCapture       — reuses existing component, gated by NEXT_PUBLIC_EMAIL_CAPTURE
 *
 * Every block renders NULL when its env var(s) are unset.
 * Each block is visually distinct from ads.
 * Content area >= ad+affiliate area (DisplaySlot is one unit; CTAs are text+button).
 */

import { useRef, useEffect, useState } from "react";
import { Phone, ExternalLink } from "lucide-react";
import { EmailCapture } from "@/components/shared/email-capture";
import { AdProvider } from "@/components/monetization/AdProvider";
import { getMonetizationConfig, type FeaturedPartner } from "@/lib/monetization";
import { isSafeUrl } from "@/lib/utils/sanitize";
import { FOCUS_RING } from "@/lib/utils/styles";
import { DISCLAIMER_SHORT } from "@/lib/constants/disclaimer";
import { getPartnersForCategory, getAffiliateTrackingUrl } from "@/lib/constants/affiliates";

interface ResultMonetizationProps {
  /** Optional context for the email capture form label. */
  context?: string;
  /** Category slug for affiliate partner filtering. */
  categorySlug?: string;
  /** State name for affiliate partner label. */
  stateName?: string;
  className?: string;
}

// ── (a) PrimaryIntentCTA ─────────────────────────────────────────────────────

function PrimaryIntentCTA({
  categorySlug,
}: {
  categorySlug?: string;
}) {
  const cfg = getMonetizationConfig();
  const type = cfg.primaryCTAType;

  if (type === "none") return null;

  if (type === "call") {
    const num = cfg.ppcNumber;
    if (!num) return null;
    const label = cfg.ppcLabel || "Speak with a Legal Professional";
    // Normalize: strip non-digit chars for tel: href but keep label as-is.
    const telHref = `tel:${num.replace(/[^\d+]/g, "")}`;
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          Free Consultation Available
        </p>
        <a
          href={telHref}
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-700 sm:w-auto ${FOCUS_RING}`}
          rel="noopener"
        >
          <Phone className="h-5 w-5" aria-hidden="true" />
          {label}
        </a>
        <p className="mt-2 text-xs text-teal-600">{DISCLAIMER_SHORT}</p>
      </div>
    );
  }

  if (type === "cpl") {
    const url = cfg.cplUrl;
    if (!url || !isSafeUrl(url)) return null;
    const label = cfg.cplLabel || "Get a Free Case Evaluation";
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
          Get Connected with an Attorney
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-700 sm:w-auto ${FOCUS_RING}`}
        >
          {label}
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <p className="mt-2 text-xs text-teal-600">{DISCLAIMER_SHORT}</p>
      </div>
    );
  }

  if (type === "affiliate") {
    // Show the first env-configured affiliate partner (featured affiliate button).
    const candidates = getPartnersForCategory(categorySlug);
    for (const partner of candidates) {
      const trackingUrl = getAffiliateTrackingUrl(partner, isSafeUrl);
      if (trackingUrl) {
        return (
          <div className="rounded-lg border border-teal-200 bg-teal-50 p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-teal-700">
              Recommended Legal Service
            </p>
            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-teal-600 px-5 py-3 text-base font-semibold text-white transition-colors hover:bg-teal-700 sm:w-auto ${FOCUS_RING}`}
            >
              {partner.ctaText}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <p className="mt-2 text-xs text-teal-600">
              Affiliate link — we may earn a commission at no cost to you.{" "}
              {DISCLAIMER_SHORT}
            </p>
          </div>
        );
      }
    }
    return null;
  }

  return null;
}

// ── (c) FeaturedPartnerTable ─────────────────────────────────────────────────

function FeaturedPartnerTableBlock({
  partners,
}: {
  partners: FeaturedPartner[];
}) {
  if (partners.length === 0) return null;
  return (
    <div>
      {/* FTC advertiser disclosure — inline directly ABOVE the table, not in footer */}
      <p className="mb-3 text-xs font-medium text-slate-500">
        Advertiser Disclosure: The companies listed in this table may compensate
        LegalCostCalc when you click their links. This does not influence our
        cost estimates or editorial content.
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <caption className="sr-only">Featured legal service providers</caption>
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Provider
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Starting From
              </th>
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Visit</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {partners.slice(0, 5).map((p) => {
              const safeSrc = isSafeUrl(p.href) ? p.href : null;
              return (
                <tr key={p.label} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {p.label}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-700">
                    {p.figure}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {safeSrc ? (
                      <a
                        href={safeSrc}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className={`inline-flex items-center gap-1 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-teal-700 ${FOCUS_RING}`}
                      >
                        Visit
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── (d) SponsorSlot ──────────────────────────────────────────────────────────

function SponsorSlot() {
  const cfg = getMonetizationConfig();

  // sponsorHtml is rendered as text only — no HTML parsing is performed.
  // The env var value is treated as a plain-text message from the owner.
  if (cfg.sponsorHtml) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Sponsored
        </p>
        <p className="text-sm text-slate-700">{cfg.sponsorHtml}</p>
      </div>
    );
  }

  if (cfg.sponsorBackfillUrl && isSafeUrl(cfg.sponsorBackfillUrl)) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          Sponsored
        </p>
        <a
          href={cfg.sponsorBackfillUrl}
          target="_blank"
          rel="noopener noreferrer nofollow sponsored"
          className={`text-sm font-medium text-teal-700 underline hover:text-teal-800 ${FOCUS_RING}`}
        >
          Learn more about our sponsor
          <ExternalLink
            className="ml-1 inline h-3 w-3 align-middle"
            aria-hidden="true"
          />
        </a>
      </div>
    );
  }

  return null;
}

// ── (b) DisplaySlot lazy wrapper ─────────────────────────────────────────────

function DisplaySlot() {
  const wrapRef = useRef<HTMLDivElement>(null);
  // Start visible immediately if IntersectionObserver is unavailable (SSR/old browser).
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  );

  useEffect(() => {
    // Already visible (IO unavailable) — nothing to observe.
    if (visible) return;
    const node = wrapRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div
      ref={wrapRef}
      className="min-h-[90px] sm:min-h-[250px]"
      aria-label="Advertisement"
    >
      {visible && <AdProvider lazy={false} className="w-full" />}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────────────────────

export function ResultMonetization({
  context,
  categorySlug,
  stateName: _stateName, // eslint-disable-line @typescript-eslint/no-unused-vars
  className,
}: ResultMonetizationProps) {
  const cfg = getMonetizationConfig();

  return (
    <div className={`mt-8 space-y-6 ${className ?? ""}`}>
      {/* (a) Primary intent CTA */}
      <PrimaryIntentCTA categorySlug={categorySlug} />

      {/* (b) Single programmatic display unit — >= 150px below calculate button
              (the mt-8 on this container + space-y-6 guarantees separation).
              min-height reserved to prevent CLS. */}
      <DisplaySlot />

      {/* (c) FTC disclosure + featured partner table */}
      <FeaturedPartnerTableBlock partners={cfg.featuredPartners} />

      {/* (d) Sponsor slot */}
      <SponsorSlot />

      {/* (e) Email capture — reuses existing component + /api/subscribe route */}
      {cfg.emailCaptureEnabled && (
        <EmailCapture context={context} />
      )}
    </div>
  );
}
