export interface AffiliatePartner {
  slug: string;
  name: string;
  description: string;
  /**
   * Public landing URL. Used ONLY to display a neutral (non-clickable) partner
   * label when no affiliate tracking URL is set. Never used as a live outbound link.
   */
  url: string;
  /**
   * Env-var name the owner must set to activate a clickable affiliate link for
   * this partner (e.g. NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL). The value must be
   * a valid HTTPS affiliate/tracking URL from the partner's program dashboard
   * (Impact, CJ, ShareASale, etc.). When unset, the CTA block is suppressed.
   *
   * No hardcoded affiliate URL is ever shipped — the owner sets this in Vercel /
   * .env.local.
   */
  affiliateUrlEnvVar: string;
  ctaText: string;
  /** Category slugs this partner is most relevant for, empty = all */
  relevantCategories: string[];
}

/**
 * Curated US legal services.
 *
 * HOW TO ACTIVATE AN AFFILIATE LINK
 * ----------------------------------
 * Set the env var listed in `affiliateUrlEnvVar` to your real tracking URL from
 * the partner's affiliate dashboard:
 *   - LegalZoom / Rocket Lawyer — Impact (impact.com)
 *   - Nolo / Avvo — Martindale-Nolo / CJ (cj.com)
 *   - LawDepot / US Legal Forms — ShareASale / CJ
 *   - LegalMatch — direct partner/lead-gen program
 *
 * No affiliate URL is hardcoded here. When the env var is unset, no link is
 * rendered and the partner slot is suppressed entirely.
 *
 * Example (.env.local or Vercel Environment Variables):
 *   NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL=https://tracking.impact.com/your-id/...
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    slug: "legalzoom",
    name: "LegalZoom",
    description: "Online legal services for business and personal needs",
    url: "https://www.legalzoom.com",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL",
    ctaText: "Get Started with LegalZoom",
    relevantCategories: ["divorce", "bankruptcy", "real-estate", "estate-planning", "immigration"],
  },
  {
    slug: "rocket-lawyer",
    name: "Rocket Lawyer",
    description: "Affordable legal help and document services",
    url: "https://www.rocketlawyer.com",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL",
    ctaText: "Try Rocket Lawyer",
    relevantCategories: ["divorce", "real-estate", "estate-planning", "bankruptcy"],
  },
  {
    slug: "legalmatch",
    name: "LegalMatch",
    description: "Get matched with pre-screened local attorneys by practice area",
    url: "https://www.legalmatch.com",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL",
    ctaText: "Find a Local Attorney",
    relevantCategories: ["personal-injury", "dui", "criminal-defense", "divorce"],
  },
  {
    slug: "avvo",
    name: "Avvo",
    description: "Find and compare top-rated attorneys in your area",
    url: "https://www.avvo.com",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_AVVO_URL",
    ctaText: "Find a Lawyer on Avvo",
    relevantCategories: [],
  },
  {
    slug: "nolo",
    name: "Nolo",
    description: "Plain-English legal information and a vetted lawyer directory",
    url: "https://www.nolo.com/lawyers",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_NOLO_URL",
    ctaText: "Browse the Nolo Directory",
    relevantCategories: ["dui", "bankruptcy", "personal-injury", "criminal-defense"],
  },
  {
    slug: "lawdepot",
    name: "LawDepot",
    description: "Customizable legal documents and contracts",
    url: "https://www.lawdepot.com",
    affiliateUrlEnvVar: "NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL",
    ctaText: "Create a Legal Document",
    relevantCategories: ["real-estate", "estate-planning"],
  },
];

/** Max partners to show in a single CTA block (keeps the UI clean). */
const MAX_PARTNERS_SHOWN = 3;

/**
 * Get partners relevant to a given legal category, capped for display.
 * Returns all-category partners (relevantCategories empty) plus category matches.
 */
export function getPartnersForCategory(categorySlug?: string): AffiliatePartner[] {
  const matches = !categorySlug
    ? AFFILIATE_PARTNERS
    : AFFILIATE_PARTNERS.filter(
        (p) => p.relevantCategories.length === 0 || p.relevantCategories.includes(categorySlug),
      );
  return matches.slice(0, MAX_PARTNERS_SHOWN);
}

/**
 * Returns the live affiliate tracking URL for a given partner, read from the
 * corresponding NEXT_PUBLIC_AFFILIATE_<SLUG>_URL environment variable.
 *
 * Returns undefined when:
 *   - The env var is not set (owner has not joined/configured the program yet)
 *   - The env var value is an unsafe URL (fails isSafeUrl HTTPS check)
 *
 * This ensures no clickable affiliate link is ever rendered without an
 * explicit, owner-supplied, HTTPS-only tracking URL. No hardcoded URL is
 * returned as a fallback.
 */
export function getAffiliateTrackingUrl(
  partner: AffiliatePartner,
  isSafeUrl: (url: string) => boolean,
): string | undefined {
  // NEXT_PUBLIC_* env vars are inlined at build time by Next.js; using a
  // bracket-access lookup (process.env[varName]) works at runtime in both
  // server and client contexts via the Next.js env-var substitution.
  const rawValue =
    typeof process !== "undefined" ? process.env[partner.affiliateUrlEnvVar] : undefined;
  if (!rawValue || !isSafeUrl(rawValue)) return undefined;
  return rawValue;
}
