/**
 * Sibling "cost calculator" sites in the same network. Used by the
 * "More free cost calculators" cross-link module. Self (legalcostcalc.co) is
 * intentionally excluded. Anchors/descriptions are contextual, not identical
 * spammy boilerplate (avoids link-scheme patterns — see STRATEGY.md §3.6).
 */

export interface SiblingSite {
  /** Display name used as the link anchor. */
  name: string;
  /** Absolute https URL (production domain). */
  url: string;
  /** Short, contextual description (one sentence). */
  description: string;
}

export const SIBLING_SITES: readonly SiblingSite[] = [
  {
    name: "DentalCostFinder",
    url: "https://dentalcostfinder.co",
    description:
      "Estimate dental procedure costs — implants, crowns, and more — by state.",
  },
  {
    name: "GoFIREPath",
    url: "https://gofirepath.com",
    description:
      "FIRE & early-retirement calculator: see how much you need to retire.",
  },
  {
    name: "LaunchCostCalc",
    url: "https://launchcostcalc.com",
    description:
      "Budget the real cost of launching a startup, from incorporation to runway.",
  },
  {
    name: "SaaSCostX",
    url: "https://saascostx.com",
    description:
      "Calculate and benchmark your company's SaaS spend per employee.",
  },
] as const;
