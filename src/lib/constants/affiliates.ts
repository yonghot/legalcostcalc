export interface AffiliatePartner {
  slug: string;
  name: string;
  description: string;
  /** Public landing URL (used as a referral link with UTM params if no affiliateUrl). */
  url: string;
  /**
   * Your real affiliate/tracking link from the partner's affiliate dashboard
   * (e.g. an Impact, CJ, or ShareASale link). THIS is what actually credits you
   * a commission. Leave empty until you've joined the program — the component
   * falls back to `url` + UTM so links still work, just without commission tracking.
   */
  affiliateUrl?: string;
  ctaText: string;
  /** Category slugs this partner is most relevant for, empty = all */
  relevantCategories: string[];
}

/**
 * Curated US legal services. `url` values are the real public sites; replace
 * `affiliateUrl` with your tracking link once you join each program:
 *  - LegalZoom / Rocket Lawyer — Impact (impact.com)
 *  - Nolo / Avvo — Martindale-Nolo affiliate (CJ)
 *  - LawDepot / US Legal Forms — ShareASale / CJ
 *  - LegalMatch — direct lead-gen / partner program (highest payout for PI/DUI)
 *
 * Lead-gen (LegalMatch, Avvo) typically pays far more per click for high-value
 * matters (personal injury, DUI, divorce) than document services.
 */
export const AFFILIATE_PARTNERS: AffiliatePartner[] = [
  {
    slug: "legalzoom",
    name: "LegalZoom",
    description: "Online legal services for business and personal needs",
    url: "https://www.legalzoom.com",
    ctaText: "Get Started with LegalZoom",
    relevantCategories: ["divorce", "bankruptcy", "real-estate", "estate-planning", "immigration"],
  },
  {
    slug: "rocket-lawyer",
    name: "Rocket Lawyer",
    description: "Affordable legal help and document services",
    url: "https://www.rocketlawyer.com",
    ctaText: "Try Rocket Lawyer",
    relevantCategories: ["divorce", "real-estate", "estate-planning", "bankruptcy"],
  },
  {
    slug: "legalmatch",
    name: "LegalMatch",
    description: "Get matched with pre-screened local attorneys for your case",
    url: "https://www.legalmatch.com",
    ctaText: "Find a Local Attorney",
    relevantCategories: ["personal-injury", "dui", "criminal-defense", "divorce"],
  },
  {
    slug: "avvo",
    name: "Avvo",
    description: "Find and compare top-rated attorneys in your area",
    url: "https://www.avvo.com",
    ctaText: "Find a Lawyer on Avvo",
    relevantCategories: [],
  },
  {
    slug: "nolo",
    name: "Nolo",
    description: "Plain-English legal information and a vetted lawyer directory",
    url: "https://www.nolo.com/lawyers",
    ctaText: "Browse the Nolo Directory",
    relevantCategories: ["dui", "bankruptcy", "personal-injury", "criminal-defense"],
  },
  {
    slug: "lawdepot",
    name: "LawDepot",
    description: "Customizable legal documents and contracts",
    url: "https://www.lawdepot.com",
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
