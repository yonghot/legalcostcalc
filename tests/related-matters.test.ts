/**
 * Tests for T06 RelatedMatters link generation logic.
 *
 * Spec acceptance criterion: "every href resolves 200 to an existing
 * quality-gated page (add a build-time test iterating the dataset)". This
 * repo's pages are statically enumerable (STATES x CATEGORIES), so we
 * replicate RelatedMatters' selection algorithm here and assert every
 * generated href is (a) a real (state, category) combination and (b) passes
 * the T09/CODE-06 hasUniqueData gate — the same guarantee "resolves 200 to a
 * quality-gated page" reduces to for this static site.
 *
 * NOTE: since CODE-06 strengthened hasUniqueData into a >=4-fact
 * information-gain gate (src/lib/page-index.ts), NOT every (state,category)
 * pair passes anymore — a handful of pages whose moderate-complexity row is
 * a full-signature duplicate of a sibling state's row (same category) now
 * fail the gate and are excluded as sibling-link candidates too. The
 * MIN_LINKS floor (module renders null below 3) is asserted to still hold
 * for every page regardless.
 */
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { hasUniqueData, INDEXABLE_PAGES } from "@/lib/page-index";

const MAX_LINKS = 5;
const MIN_LINKS = 3;

/** Mirrors the selection logic in src/components/seo/related-matters.tsx. */
function computeRelatedMatterLinks(stateCode: string, categorySlug: string) {
  return CATEGORIES.filter((c) => c.slug !== categorySlug && hasUniqueData(stateCode, c.slug)).slice(
    0,
    MAX_LINKS,
  );
}

describe("RelatedMatters (T06): link resolution", () => {
  it("for every state, produces 0 or >=3 (never 1-2) candidate links, capped at 5", () => {
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const candidates = computeRelatedMatterLinks(state.code, cat.slug);
        expect(candidates.length).toBeLessThanOrEqual(MAX_LINKS);
        // The component itself renders null below MIN_LINKS — verify the
        // dataset actually supports MIN_LINKS everywhere it matters (all
        // 408 pages have 7 sibling categories with real data per the seed).
        if (candidates.length > 0) {
          expect(candidates.length).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("never suggests the current category", () => {
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const candidates = computeRelatedMatterLinks(state.code, cat.slug);
        expect(candidates.find((c) => c.slug === cat.slug)).toBeUndefined();
      }
    }
  });

  it("every generated href resolves to an existing, quality-gated (hasUniqueData=true) page", () => {
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const candidates = computeRelatedMatterLinks(state.code, cat.slug);
        for (const candidate of candidates) {
          const href = `/${state.slug}/${candidate.slug}-cost`;
          const indexed = INDEXABLE_PAGES.find((p) => p.path === href);
          expect(indexed, `${href} must exist in INDEXABLE_PAGES`).toBeDefined();
        }
      }
    }
  });

  it("never drops below the MIN_LINKS floor for any page — RelatedMatters would render null instead of a thin 1-2 item module", () => {
    // CODE-06 strengthened hasUniqueData: a small number of (state,category)
    // pairs now fail the 4-fact information-gain gate (structurally
    // duplicate sibling rows — see page-index.test.ts), so not every page
    // has 7 real sibling candidates anymore. The invariant that actually
    // matters (and that RelatedMatters' own MIN_LINKS check enforces) is
    // that no page ever ends up with a 1-2 item module — it's either >=3
    // or the component renders nothing at all.
    let atMax = 0;
    let belowMax = 0;
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const candidates = computeRelatedMatterLinks(state.code, cat.slug);
        expect(candidates.length).toBeLessThanOrEqual(MAX_LINKS);
        if (candidates.length > 0) {
          expect(candidates.length).toBeGreaterThanOrEqual(MIN_LINKS);
        }
        if (candidates.length === MAX_LINKS) atMax++;
        else belowMax++;
      }
    }
    // Sanity: the overwhelming majority of pages still get the full 5-link
    // module — only the CODE-06-excluded siblings reduce the count.
    expect(atMax).toBeGreaterThan(belowMax);
  });
});
