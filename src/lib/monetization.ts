/**
 * lib/monetization.ts — Central monetization config.
 *
 * All values read from environment variables at call-time. Returns null/undefined
 * when the relevant env var is unset so every slot renders NULL when unconfigured.
 *
 * CWV helpers:
 *  - Every slot reserves a CSS min-height (reserved in the component via Tailwind)
 *    to keep CLS < 0.1.
 *  - Below-fold slots are lazy-loaded via IntersectionObserver in the components.
 *
 * Vertical default: Legal cost (YMYL). Primary CTA default = "call".
 */

// ── Vertical constant ─────────────────────────────────────────────────────────

/** Project-level default CTA type for the legal-cost vertical. */
export const VERTICAL_DEFAULT_CTA_TYPE = "call" as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export type AdProvider = "adsense" | "ezoic" | "raptive" | "none";
export type PrimaryCTAType = "call" | "cpl" | "affiliate" | "none";

export interface FeaturedPartner {
  label: string;
  figure: string;
  href: string;
}

export interface MonetizationConfig {
  /** Which programmatic ad network to load (exactly one, never two). */
  adProvider: AdProvider;

  /** AdSense client id (ca-pub-…). Null when unset. */
  adSenseClientId: string | null;

  /** Ezoic: whether Ezoic is enabled. Script src/id come from env. */
  ezoicEnabled: boolean;
  ezoicScriptSrc: string | null;

  /** Raptive site id. Null when unset. */
  raptiveSiteId: string | null;

  /** /ads.txt redirect target. When set, route 301s there. */
  adsTxtRedirectUrl: string | null;

  /** Which primary CTA to show. Falls back to vertical default. */
  primaryCTAType: PrimaryCTAType;

  /** Pay-per-call config. */
  ppcNumber: string | null;
  ppcLabel: string | null;

  /** Cost-per-lead outbound link config. */
  cplUrl: string | null;
  cplLabel: string | null;

  /** Featured partner table rows. Empty array when unset or invalid JSON. */
  featuredPartners: FeaturedPartner[];

  /** Sponsor slot — HTML string or null. */
  sponsorHtml: string | null;

  /** Sponsor backfill URL when sponsorHtml is absent. */
  sponsorBackfillUrl: string | null;

  /** Whether to show the email capture block. */
  emailCaptureEnabled: boolean;

  /** Auto-affiliate provider for uncontracted links (e.g. "sovrn" or "skimlinks:id"). */
  autoAffiliate: string | null;
}

// ── Parser helpers ────────────────────────────────────────────────────────────

function readEnv(key: string): string | null {
  if (typeof process === "undefined") return null;
  const v = process.env[key];
  return v && v.trim() !== "" ? v.trim() : null;
}

/**
 * Parse MON_FEATURED_PARTNERS — a JSON array of {label, figure, href}.
 * Returns [] on any parse/validation failure so the table renders nothing.
 */
export function parseFeaturedPartners(raw: string | null): FeaturedPartner[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const rows: FeaturedPartner[] = [];
    for (const item of parsed) {
      if (
        item &&
        typeof item === "object" &&
        typeof (item as Record<string, unknown>).label === "string" &&
        typeof (item as Record<string, unknown>).figure === "string" &&
        typeof (item as Record<string, unknown>).href === "string"
      ) {
        rows.push({
          label: (item as Record<string, string>).label,
          figure: (item as Record<string, string>).figure,
          href: (item as Record<string, string>).href,
        });
      }
    }
    return rows;
  } catch {
    return [];
  }
}

/**
 * Parse NEXT_PUBLIC_AD_PROVIDER.
 * Defaults to "adsense" when unset (backward compatible).
 */
export function parseAdProvider(raw: string | null): AdProvider {
  if (raw === "ezoic" || raw === "raptive" || raw === "none") return raw;
  return "adsense";
}

/**
 * Parse NEXT_PUBLIC_PRIMARY_CTA_TYPE.
 * Falls back to the vertical default ("call") when unset or unrecognized.
 */
export function parsePrimaryCTAType(raw: string | null): PrimaryCTAType {
  if (raw === "call" || raw === "cpl" || raw === "affiliate" || raw === "none")
    return raw;
  return VERTICAL_DEFAULT_CTA_TYPE;
}

// ── Main config factory ───────────────────────────────────────────────────────

/**
 * Build the monetization config by reading env variables.
 * All values are null / false / [] when their env var is unset.
 * Safe to call in both server and client contexts.
 */
export function getMonetizationConfig(): MonetizationConfig {
  const adProvider = parseAdProvider(readEnv("NEXT_PUBLIC_AD_PROVIDER"));
  const emailCaptureRaw = readEnv("NEXT_PUBLIC_EMAIL_CAPTURE");

  return {
    adProvider,
    adSenseClientId: readEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID"),
    ezoicEnabled: readEnv("NEXT_PUBLIC_EZOIC_ENABLED") === "true",
    ezoicScriptSrc: readEnv("NEXT_PUBLIC_EZOIC_SCRIPT_SRC"),
    raptiveSiteId: readEnv("NEXT_PUBLIC_RAPTIVE_SITE_ID"),
    adsTxtRedirectUrl: readEnv("NEXT_PUBLIC_ADSTXT_REDIRECT_URL"),
    primaryCTAType: parsePrimaryCTAType(readEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE")),
    ppcNumber: readEnv("NEXT_PUBLIC_PPC_NUMBER"),
    ppcLabel: readEnv("NEXT_PUBLIC_PPC_LABEL"),
    cplUrl: readEnv("NEXT_PUBLIC_CPL_URL"),
    cplLabel: readEnv("NEXT_PUBLIC_CPL_LABEL"),
    featuredPartners: parseFeaturedPartners(readEnv("MON_FEATURED_PARTNERS")),
    sponsorHtml: readEnv("NEXT_PUBLIC_SPONSOR_HTML"),
    sponsorBackfillUrl: readEnv("NEXT_PUBLIC_SPONSOR_BACKFILL_URL"),
    emailCaptureEnabled: emailCaptureRaw === "on",
    autoAffiliate: readEnv("NEXT_PUBLIC_AUTOAFFILIATE"),
  };
}
