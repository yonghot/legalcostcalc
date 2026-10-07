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
 * The second half pins that the U-04 season/revisit badge stays removed: its
 * "January is the busiest month" claim carried no source a reader could see
 * (K4/K2), and "save your estimate now" was an urgency hook.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync } from "node:fs";
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

describe("U-04 — the unsourced season/revisit badge stays removed", () => {
  it("the badge component no longer exists and the homepage does not render it", () => {
    expect(existsSync(path.resolve(__dirname, "..", "src/components/shared/seasonal-badge.tsx"))).toBe(false);
    const src = readSource("src/app/page.tsx");
    expect(src).not.toMatch(/SeasonalBadge/);
    expect(src).not.toMatch(/busiest month/i);
  });

  it("the divorce hub the badge pointed at still exists", () => {
    expect(() => readSource("src/app/divorce-cost-by-state/page.tsx")).not.toThrow();
  });
});
