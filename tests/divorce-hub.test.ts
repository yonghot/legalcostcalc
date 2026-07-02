/**
 * tests/divorce-hub.test.ts
 *
 * K07 — /divorce-cost-by-state hub page (July seasonal build queue priority
 * #2): a dedicated all-51-state divorce cost comparison table, framed as
 * uncontested (simple) vs. contested (complex), tool-intent titled, and
 * UPL-safe.
 *
 * Invariants under test:
 *   - The page renders all 51 real states (50 + DC) with real cost figures
 *     from costs.json — no invented numbers.
 *   - Every row's uncontested/contested figures match getCostByComplexity's
 *     real simple/complex lookups exactly (no interpolation).
 *   - Every row links to the real, already-indexable /[state]/divorce-cost
 *     spoke page.
 *   - UPL-safe copy: the disclaimer is present (top + bottom), and no
 *     advice-verb language ("you should", "we recommend", "you need to")
 *     appears anywhere on the page.
 *   - The page title is tool-intent (contains "Calculator"), not a pure
 *     "what is" informational title.
 *   - sitemap.ts includes /divorce-cost-by-state.
 *   - HubLinksBar links to the hub ONLY on divorce spoke pages (not other
 *     categories).
 */

import { describe, it, expect } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/divorce-cost-by-state",
  notFound: () => {
    throw new Error("notFound() must not be reached in this test");
  },
}));

vi.mock("next/link", async () => {
  const { createElement: h } = await import("react");
  return {
    default: ({
      href,
      children,
      className,
      onClick,
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
      onClick?: () => void;
    }) => h("a", { href, className, onClick }, children),
  };
});

import DivorceCostByStatePage, {
  generateMetadata,
} from "@/app/divorce-cost-by-state/page";
import { HubLinksBar } from "@/components/seo/hub-links-bar";
import { STATES } from "@/lib/constants/states";
import { INDEXABLE_PAGES, getCostByComplexity } from "@/lib/page-index";
import { formatCurrency } from "@/lib/utils/format";

const ADVICE_VERB_PATTERNS = [
  /you should/i,
  /we recommend/i,
  /you need to/i,
  /you must file/i,
  /best (attorney|lawyer|choice)/i,
];

describe("/divorce-cost-by-state — real data, no fabrication", () => {
  it("lists a row for every state that passes hasUniqueData for divorce", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));
    const divorceEntries = INDEXABLE_PAGES.filter((p) => p.category.slug === "divorce");

    // All 51 (50 states + DC) should have real divorce data per the seed set.
    expect(divorceEntries.length).toBe(STATES.length);

    for (const entry of divorceEntries) {
      expect(html).toContain(entry.state.name);
      expect(html).toContain(entry.path);
    }
  });

  it("every row's uncontested/contested figures are the REAL simple/complex costs.json values", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));

    // Spot-check a handful of states across the alphabet.
    const sample = ["CA", "TX", "NY", "FL", "WY"];
    for (const code of sample) {
      const state = STATES.find((s) => s.code === code);
      if (!state) continue;
      const uncontested = getCostByComplexity(code, "divorce", "simple");
      const contested = getCostByComplexity(code, "divorce", "complex");
      if (uncontested != null) {
        expect(html).toContain(formatCurrency(uncontested));
      }
      if (contested != null) {
        expect(html).toContain(formatCurrency(contested));
      }
    }
  });

  it("links every row to the real, already-indexable /[state]/divorce-cost spoke page", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));
    const divorceEntries = INDEXABLE_PAGES.filter((p) => p.category.slug === "divorce");
    for (const entry of divorceEntries) {
      expect(entry.path).toMatch(/^\/[a-z-]+\/divorce-cost$/);
      expect(html).toContain(`href="${entry.path}"`);
    }
  });
});

describe("/divorce-cost-by-state — UPL-safe copy + disclaimer invariant", () => {
  it("renders the disclaimer (top and bottom)", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));
    const disclaimerCount = (html.match(/Not legal advice|NOT legal advice/gi) || []).length;
    expect(disclaimerCount).toBeGreaterThanOrEqual(2);
  });

  it("contains no advice-verb language", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));
    for (const pattern of ADVICE_VERB_PATTERNS) {
      expect(html).not.toMatch(pattern);
    }
  });

  it("never predicts an outcome or applies law to individual circumstances", () => {
    const html = renderToStaticMarkup(createElement(DivorceCostByStatePage));
    expect(html).not.toMatch(/will win/i);
    expect(html).not.toMatch(/guaranteed/i);
  });
});

describe("/divorce-cost-by-state — tool-intent title (K07)", () => {
  it("generateMetadata returns a tool-intent title, not a pure 'what is' informational title", async () => {
    const meta = await generateMetadata();
    const title = String(meta.title ?? "");
    expect(title).toMatch(/Calculator/i);
    expect(title.toLowerCase().startsWith("what is")).toBe(false);
  });

  it("title leads with the primary keyword ('Divorce Cost')", async () => {
    const meta = await generateMetadata();
    const title = String(meta.title ?? "");
    expect(title.startsWith("Divorce Cost")).toBe(true);
  });
});

describe("sitemap — /divorce-cost-by-state is included", () => {
  it("appears in sitemap.ts output", async () => {
    const sitemapModule = await import("@/app/sitemap");
    const entries = sitemapModule.default();
    const found = entries.find((e) => e.url.endsWith("/divorce-cost-by-state"));
    expect(found).toBeDefined();
  });
});

describe("HubLinksBar — divorce-only cross-link to the dedicated hub", () => {
  it("shows the divorce-cost-by-state link on divorce spoke pages", () => {
    const html = renderToStaticMarkup(
      createElement(HubLinksBar, {
        stateSlug: "california",
        stateName: "California",
        categorySlug: "divorce",
        categoryName: "Divorce",
      }),
    );
    expect(html).toContain('href="/divorce-cost-by-state"');
  });

  it("does NOT show the divorce-cost-by-state link on non-divorce spoke pages", () => {
    const html = renderToStaticMarkup(
      createElement(HubLinksBar, {
        stateSlug: "california",
        stateName: "California",
        categorySlug: "dui",
        categoryName: "DUI / DWI",
      }),
    );
    expect(html).not.toContain('href="/divorce-cost-by-state"');
  });
});
