export interface AffiliatePartner {
  slug: string;
  name: string;
  description: string;
  url: string;
  ctaText: string;
  /** Category slugs this partner is most relevant for, empty = all */
  relevantCategories: string[];
}

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
    slug: "avvo",
    name: "Avvo",
    description: "Find and compare top-rated attorneys in your area",
    url: "https://www.avvo.com",
    ctaText: "Find a Lawyer on Avvo",
    relevantCategories: [],
  },
  {
    slug: "rocket-lawyer",
    name: "Rocket Lawyer",
    description: "Affordable legal help and document services",
    url: "https://www.rocketlawyer.com",
    ctaText: "Try Rocket Lawyer",
    relevantCategories: ["divorce", "real-estate", "estate-planning"],
  },
];

/**
 * Get partners relevant to a given legal category.
 * Returns all partners if category is empty, or partners where
 * relevantCategories is empty (applies to all) or includes the category.
 */
export function getPartnersForCategory(categorySlug?: string): AffiliatePartner[] {
  if (!categorySlug) return AFFILIATE_PARTNERS;
  return AFFILIATE_PARTNERS.filter(
    (p) => p.relevantCategories.length === 0 || p.relevantCategories.includes(categorySlug),
  );
}
