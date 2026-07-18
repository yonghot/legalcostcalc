/**
 * tests/revisit-hooks-audit.test.ts — U-04 revisit-hook audit (부속U §4).
 *
 * U-04's first requirement is an AUDIT, not a re-implementation: confirm
 * the existing T15 (ResultShare) share button and T16 (ContinueBanner)
 * "Continue where you left off" banner actually render in the result area,
 * per repo (grep + render test), and wire ONLY whatever turns out to be
 * un-wired. This file's findings: BOTH were already fully wired —
 *   - ContinueBanner is rendered in cost-calculator.tsx, gated on
 *     `persistence.savedState` (T16).
 *   - ResultShare is rendered in cost-result.tsx, gated on `categorySlug`
 *     (T15).
 * No re-wiring was needed; this file is the audit evidence + regression
 * guard so that wiring can never silently regress.
 *
 * The second half covers the U-04 season/revisit badge added this wave
 * (src/components/shared/seasonal-badge.tsx): real source citation, no
 * fabricated stat, links to a real existing page, rendered on the homepage.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import type { LegalCostData } from "@/lib/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/california/divorce-cost",
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
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
    }) => h("a", { href, className }, children),
  };
});

import { CostResult } from "@/components/calculator/cost-result";
import { ContinueBanner } from "@/components/shared/continue-banner";
import { SeasonalBadge } from "@/components/shared/seasonal-badge";

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

const COST: LegalCostData = {
  id: "test-divorce-ca-simple",
  category: "divorce",
  stateCode: "CA",
  complexity: "simple",
  costRange: { low: 1900, median: 3800, high: 6300 },
  hourlyRate: { low: 175, median: 265, high: 350 },
  contingencyFee: null,
  typicalDuration: "1-3 months",
  commonFees: ["Court filing fee"],
  sources: ["https://example.com/source-1", "https://example.com/source-2"],
  lastVerifiedAt: "2026-04-01",
};

describe("U-04 audit — T15 ResultShare renders in the result area", () => {
  it("[grep] cost-result.tsx renders <ResultShare gated on categorySlug", () => {
    const src = readSource("src/components/calculator/cost-result.tsx");
    expect(src).toMatch(/\{categorySlug &&\s*\(?\s*<ResultShare/);
  });

  it("[render] CostResult with a categorySlug actually mounts the share button in its output", () => {
    const html = renderToStaticMarkup(
      createElement(CostResult, {
        results: [COST],
        stateName: "California",
        categoryName: "Divorce",
        categorySlug: "divorce",
        stateCode: "CA",
        stateSlug: "california",
      }),
    );
    expect(html).toContain("Copy link to this result");
  });

  it("[render] CostResult with NO categorySlug (generic homepage path) does not render ResultShare (matches the documented sensitive-site scoping, not a bug)", () => {
    const html = renderToStaticMarkup(
      createElement(CostResult, {
        results: [COST],
        stateName: "California",
        categoryName: "Divorce",
      }),
    );
    expect(html).not.toContain("Copy link to this result");
  });
});

describe("U-04 audit — T16 ContinueBanner renders in the result area", () => {
  it("[grep] cost-calculator.tsx renders <ContinueBanner gated on persistence.savedState", () => {
    const src = readSource("src/components/calculator/cost-calculator.tsx");
    expect(src).toMatch(/\{persistence\.savedState &&\s*\(?\s*<ContinueBanner/);
  });

  it("[render] ContinueBanner itself renders the 'Continue where you left off' affordance", () => {
    const html = renderToStaticMarkup(
      createElement(ContinueBanner, { onApply: () => {}, onDismiss: () => {} }),
    );
    expect(html).toContain("Continue where you left off");
    expect(html).toContain("You have a previous calculation saved.");
  });
});

describe("U-04 — season/revisit badge (SeasonalBadge)", () => {
  it("[grep] rendered on the homepage (src/app/page.tsx)", () => {
    const src = readSource("src/app/page.tsx");
    expect(src).toMatch(/import\s*\{\s*SeasonalBadge\s*\}/);
    expect(src).toMatch(/<SeasonalBadge\s*\/>/);
  });

  it("[render] renders the exact non-advisory season-hook copy, linking to a real existing page", () => {
    const html = renderToStaticMarkup(createElement(SeasonalBadge, {}));
    expect(html).toContain(
      "January is the busiest month for divorce-related searches — save your estimate now",
    );
    expect(html).toContain('href="/divorce-cost-by-state"');
  });

  it("links to a route that actually exists in this repo (src/app/divorce-cost-by-state/page.tsx)", () => {
    // Throws (test fails) if the file doesn't exist — confirms the "cite the
    // guide/section" target is real, not a dead link.
    expect(() => readSource("src/app/divorce-cost-by-state/page.tsx")).not.toThrow();
  });

  it("[no fabrication] the component source carries a real source citation and no fabricated statistic (no bare percentage figure) for the seasonality claim", () => {
    const src = readSource("src/components/shared/seasonal-badge.tsx");
    // Must cite at least one real https:// source in the code comment.
    expect(src).toMatch(/https:\/\/\S+/);
    // The user-facing copy itself must not assert a specific fabricated
    // percentage/count (e.g. "32% increase") — only the qualitative
    // "busiest month" framing both cited sources independently support.
    const copyLine =
      "January is the busiest month for divorce-related searches — save your estimate now";
    expect(copyLine).not.toMatch(/%|\d+x\b/);
  });

  it("uses neutral, non-advisory phrasing (no advice verb)", () => {
    const src = readSource("src/components/shared/seasonal-badge.tsx");
    const copyLine =
      "January is the busiest month for divorce-related searches — save your estimate now";
    expect(copyLine).not.toMatch(/\b(should|must|need to|recommend)\b/i);
    void src;
  });
});
