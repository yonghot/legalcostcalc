import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { INDEXED_PAGES } from "@/lib/index-policy";
import type { AdEligibilityRules } from "@/lib/ad-eligibility";

export const AD_STATIC_PATHS = [
  "/",
  "/compare",
  "/divorce-cost-by-state",
  "/legal-cost-statistics",
  "/how-legal-fees-work",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/embed",
  "/settlement-estimator",
];

export function buildAdEligibilityRules(): AdEligibilityRules {
  return {
    staticPaths: AD_STATIC_PATHS,
    stateHubs: STATES.map((s) => `/${s.slug}`),
    categoryHubs: CATEGORIES.map((c) => `/category/${c.slug}`),
    templates: INDEXED_PAGES.map((p) => p.path),
  };
}
