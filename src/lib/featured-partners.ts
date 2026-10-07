import { parseFeaturedPartners, type FeaturedPartner } from "@/lib/monetization";

// MON_FEATURED_PARTNERS is server-only: call this from a server component and pass the rows down as a prop.
export function getFeaturedPartners(): FeaturedPartner[] {
  return parseFeaturedPartners(process.env.MON_FEATURED_PARTNERS?.trim() || null);
}
