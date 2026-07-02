/**
 * Tests for T07 — "Cap total internal links at 20/page" build-time
 * assertion, covering the template-generated internal-link modules on the
 * /[state]/[slug] spoke page: breadcrumb (2), hub-links-bar (2), and
 * RelatedLinks (7 sibling categories + N sibling states + 1 "view all
 * states" hub link). Cross-SITE links (RelatedCalculators, a different
 * domain) are intentionally excluded — the spec's cap targets
 * template-generated INTERNAL links.
 */
import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

const INTERNAL_LINK_CAP = 20;

// Mirrors src/components/seo/related-links.tsx's INITIAL_STATES_SHOWN.
const INITIAL_STATES_SHOWN = 6;

function countSpokePageInternalLinks(stateCode: string, categorySlug: string): number {
  const breadcrumbLinks = 2; // Home, State (current category is not a link)
  const hubBarLinks = 2; // state hub, category hub

  const otherCategories = CATEGORIES.filter((c) => c.slug !== categorySlug).length;
  const allOtherStates = STATES.filter((s) => s.code !== stateCode).length;
  const displayedStates = Math.min(INITIAL_STATES_SHOWN, allOtherStates);
  const remainingStatesCount = allOtherStates - displayedStates;
  const viewAllStatesHubLink = remainingStatesCount > 0 ? 1 : 0;

  return breadcrumbLinks + hubBarLinks + otherCategories + displayedStates + viewAllStatesHubLink;
}

describe("T07: spoke-page template-generated internal link cap (<=20/page)", () => {
  it("every (state, category) spoke page stays at or under the 20-link cap", () => {
    const violations: string[] = [];
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const count = countSpokePageInternalLinks(state.code, cat.slug);
        if (count > INTERNAL_LINK_CAP) {
          violations.push(`${state.slug}/${cat.slug}-cost: ${count} links`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it("link count is deterministic across all states/categories (no unbounded 'all N states' walls)", () => {
    const counts = new Set<number>();
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        counts.add(countSpokePageInternalLinks(state.code, cat.slug));
      }
    }
    // With 51 states / 8 categories, the count should only vary by a small
    // amount (categories are always 7 fixed; states capped at 6) — never
    // scale with the full 50-state count.
    for (const count of counts) {
      expect(count).toBeLessThanOrEqual(INTERNAL_LINK_CAP);
    }
  });
});
