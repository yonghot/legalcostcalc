/**
 * seo.ts — T10 shared metadata helper: buildMeta() produces a Next.js
 * Metadata object with a title in the 50-60 char range (primary keyword in
 * the first 30 chars), a unique description, an explicit canonical, and OG
 * fields — used across every route (including dynamic ones) so canonical/
 * title conventions live in one place instead of being hand-rolled per page.
 *
 * This module is distinct from src/lib/utils/seo.ts (existing FAQ-schema /
 * legacy title-template helpers used by [state]/[slug] before this wave) —
 * buildMeta() is additive and the migrated routes now call it directly.
 *
 * CRITICAL: canonical/OG URLs always resolve against the canonical production
 * domain (NEXT_PUBLIC_APP_URL when set, else the hardcoded legalcostcalc.co
 * fallback used sitewide) — never a *.vercel.app preview host.
 */
import { Metadata } from "next";

export const SITE_NAME = "LegalCostCalc";

/** Canonical production origin — mirrors the fallback used in sitemap.ts/robots.ts. */
export const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://legalcostcalc.co";

const MIN_TITLE_LENGTH = 50;
const MAX_TITLE_LENGTH = 60;

/**
 * Build an SEO title within [50,60] chars with the primary keyword (assumed
 * to be the leading phrase / `keyword` arg) in the first 30 characters.
 *
 * `core` is the keyword-first phrase (e.g. "Divorce Cost in California") that
 * MUST appear verbatim at the start of the returned title, so it always
 * satisfies the "title matches H1 leading phrase" acceptance criterion.
 * `year` defaults to the current year. Progressively tries longer/shorter
 * padded suffixes until one lands in range; a final hard-truncate is a
 * safety net that should never trigger for real (state, category) pairs
 * (verified by tests/seo-meta.test.ts across the full page matrix).
 */
export function fitTitle(core: string, year: number = new Date().getFullYear()): string {
  const suffixes = [
    `: ${year} Attorney Fee Guide`,
    `: ${year} Fee & Cost Guide`,
    `: ${year} Legal Fee Guide`,
    `: ${year} Cost Estimate Guide`,
    ` (${year}) — ${SITE_NAME}`,
    `: ${year} Estimate`,
    ` (${year})`,
    "",
  ];

  let bestCandidate = core;
  let bestDistance = Infinity;

  for (const suffix of suffixes) {
    const candidate = `${core}${suffix}`;
    if (candidate.length >= MIN_TITLE_LENGTH && candidate.length <= MAX_TITLE_LENGTH) {
      return candidate;
    }
    const distance =
      candidate.length < MIN_TITLE_LENGTH
        ? MIN_TITLE_LENGTH - candidate.length
        : candidate.length - MAX_TITLE_LENGTH;
    if (distance < bestDistance) {
      bestDistance = distance;
      bestCandidate = candidate;
    }
  }

  // Safety net: pad short titles with a generic suffix, then hard-truncate
  // anything still outside range. Should not trigger for the real dataset.
  if (bestCandidate.length < MIN_TITLE_LENGTH) {
    bestCandidate = `${bestCandidate} — Cost Data & Estimates`;
  }
  return bestCandidate.slice(0, MAX_TITLE_LENGTH);
}

export interface BuildMetaParams {
  /** Keyword-first title core, e.g. "Divorce Cost in California" — must lead the final title. */
  title: string;
  /** Unique, concrete per-page description. */
  description: string;
  /** Site-relative canonical path, e.g. "/california/divorce-cost" or "/about". */
  path: string;
  /** Optional year override (defaults to current year) for title padding. */
  year?: number;
  /** Set true to fix the title verbatim (skip the fit algorithm) for short static pages. */
  skipFit?: boolean;
  /**
   * robots override — e.g. { index: false, follow: true } for thin-gated
   * pages. Object form only (not the string shorthand) so buildMeta() can
   * safely merge in max-image-preview:large (K09) without a runtime type
   * check — every real call site in this repo already passes an object.
   */
  robots?: Exclude<Metadata["robots"], string | null>;
}

/**
 * Shared metadata builder. Sets metadataBase from CANONICAL_ORIGIN,
 * alternates.canonical on every route (including dynamic ones — so
 * query-param share URLs canonicalize to the clean path), and keeps existing
 * OG/twitter conventions used sitewide (type website, siteName, locale en_US).
 */
export function buildMeta({
  title,
  description,
  path,
  year,
  skipFit = false,
  robots,
}: BuildMetaParams): Metadata {
  const finalTitle = skipFit ? title : fitTitle(title, year);
  const canonicalUrl = `${CANONICAL_ORIGIN}${path}`;

  // K09 — Discover hygiene: every explicit robots override this helper emits
  // also carries max-image-preview:large (Next.js's Metadata.robots does NOT
  // deep-merge with the root layout's robots block — an explicit object here
  // REPLACES it entirely, so omitting this would silently drop the sitewide
  // Discover-eligibility directive on every page that passes an override,
  // e.g. the T09 thin-page noindex gate on /[state]/[slug]). Pages that pass
  // no override (robots: undefined) inherit the root layout's
  // max-image-preview:large as-is.
  const resolvedRobots: Metadata["robots"] | undefined = robots
    ? { "max-image-preview": "large", ...robots }
    : undefined;

  return {
    title: finalTitle,
    description,
    metadataBase: new URL(CANONICAL_ORIGIN),
    alternates: {
      canonical: path,
    },
    openGraph: {
      title: finalTitle,
      description,
      type: "website",
      url: canonicalUrl,
      siteName: SITE_NAME,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: finalTitle,
      description,
    },
    ...(resolvedRobots ? { robots: resolvedRobots } : {}),
  };
}
