/**
 * seo.ts — shared metadata helper: buildMeta() produces a Next.js Metadata
 * object with an absolute title (brand included, at most 60 characters), a
 * unique description, an explicit canonical, and OG fields — used across every
 * route (including dynamic ones) so canonical/title conventions live in one place.
 *
 * Distinct from src/lib/utils/seo.ts (FAQ-schema / legacy title-template helpers).
 *
 * CRITICAL: canonical/OG URLs always resolve against the canonical production
 * domain (NEXT_PUBLIC_APP_URL when set, else the hardcoded legalcostcalc.co
 * fallback used sitewide) — never a *.vercel.app preview host.
 */
import { Metadata } from "next";
import { latestContentYear } from "@/lib/content-dates";

export const SITE_NAME = "LegalCostCalc";

/** Canonical production origin — mirrors the fallback used in sitemap.ts/robots.ts. */
export const CANONICAL_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://legalcostcalc.co";

const MAX_TITLE_LENGTH = 60;
const BRAND_SUFFIX = ` — ${SITE_NAME}`;

export function fitTitle(core: string, year: number): string {
  const candidates = [
    `${core} (${year})${BRAND_SUFFIX}`,
    `${core}${BRAND_SUFFIX}`,
    `${core} (${year})`,
    core,
  ];
  return candidates.find((c) => c.length <= MAX_TITLE_LENGTH) ?? core;
}

export function fixedTitle(text: string): string {
  if (text.includes(SITE_NAME)) return text;
  const branded = `${text}${BRAND_SUFFIX}`;
  return branded.length <= MAX_TITLE_LENGTH ? branded : text;
}

export interface BuildMetaParams {
  /** Keyword-first title core, e.g. "Divorce Cost in California" — must lead the final title. */
  title: string;
  /** Unique, concrete per-page description. */
  description: string;
  /** Site-relative canonical path, e.g. "/california/divorce-cost" or "/about". */
  path: string;
  /** Content year for title padding (defaults to the latest year in content-dates). */
  year?: number;
  /** Set true for a hand-written title: used as written, brand appended only when it fits in 60 characters. */
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
  const finalTitle = skipFit ? fixedTitle(title) : fitTitle(title, year ?? latestContentYear());
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
    title: { absolute: finalTitle },
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
