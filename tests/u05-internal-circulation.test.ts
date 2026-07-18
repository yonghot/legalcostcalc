/**
 * tests/u05-internal-circulation.test.ts
 *
 * U-05 (부속U §4/§5) — guide<->calculator<->statistics internal-link
 * circulation, on top of Wave B's U-02 guide. Builds on (does not duplicate)
 * tests/guide-how-legal-fees-work.test.ts's existing "links to the
 * calculator and at least one real spoke page" check, which only asserted
 * the end-of-page "Related tools" list.
 *
 * Acceptance under test (부속U §4 U-05 사양 + this wave's task spec):
 *   - Guide -> calculator: >=3 IN-CONTEXT deep links (rendered directly
 *     below the relevant body section's own prose, not just in a footer
 *     link dump) to real, quality-gated /[state]/[category]-cost pages.
 *   - Guide -> statistics: >=1 in-context link to /legal-cost-statistics.
 *   - No-fabrication guardrail: every in-context calculator link target is
 *     a REAL row in costs.json that passes the hasUniqueData information-
 *     gain gate (never a thin/noindexed page).
 *   - Calculator -> guide: the result area (CostResult) links back to
 *     /how-legal-fees-work (>=1).
 *   - Sitemap lastmod for the guide reflects the guide's own real
 *     verification date (GUIDE_UPDATED), not the unrelated cost-dataset
 *     DATA_VERSION_DATE (U-03).
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  usePathname: () => "/how-legal-fees-work",
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

import HowLegalFeesWorkPage from "@/app/how-legal-fees-work/page";
import { GUIDE_SECTIONS, GUIDE_UPDATED } from "@/app/how-legal-fees-work/content";
import { CostResult } from "@/components/calculator/cost-result";
import { CostDetailsSection } from "@/components/seo/cost-details-section";
import { hasUniqueData } from "@/lib/page-index";
import sitemap from "@/app/sitemap";
import type { LegalCostData } from "@/lib/types";

const IN_CONTEXT_CALCULATOR_TARGETS = [
  { path: "/texas/dui-cost", stateCode: "TX", category: "dui" },
  { path: "/new-york/estate-planning-cost", stateCode: "NY", category: "estate-planning" },
  { path: "/california/personal-injury-cost", stateCode: "CA", category: "personal-injury" },
];
const STATISTICS_PATH = "/legal-cost-statistics";

describe("U-05 — guide -> calculator/statistics in-context deep links", () => {
  const html = renderToStaticMarkup(createElement(HowLegalFeesWorkPage));

  it("renders >=3 distinct in-context links to real calculator category pages", () => {
    for (const target of IN_CONTEXT_CALCULATOR_TARGETS) {
      expect(html).toContain(`href="${target.path}"`);
    }
  });

  it("every in-context calculator link target is a REAL, quality-gated (hasUniqueData) page — no fabrication", () => {
    for (const target of IN_CONTEXT_CALCULATOR_TARGETS) {
      expect(
        hasUniqueData(target.stateCode, target.category),
        `${target.path} must pass the hasUniqueData information-gain gate`,
      ).toBe(true);
    }
  });

  it("renders an in-context link to the statistics page", () => {
    expect(html).toContain(`href="${STATISTICS_PATH}"`);
  });

  it("the calculator/statistics in-context links are embedded WITHIN body sections, not only the end-of-page 'Related tools' list (positional check: each link appears before its section's own heading text is followed by the NEXT section's heading)", () => {
    // Locate each target link's index and confirm at least one occurrence
    // falls strictly before the "Related tools on this site" block (i.e.
    // inside the numbered body-section flow above it).
    const relatedToolsIdx = html.indexOf("Related tools on this site");
    expect(relatedToolsIdx).toBeGreaterThan(-1);

    const inBodyTargets = [
      "/texas/dui-cost",
      "/new-york/estate-planning-cost",
      "/california/personal-injury-cost",
      STATISTICS_PATH,
    ];
    for (const targetPath of inBodyTargets) {
      const idx = html.indexOf(`href="${targetPath}"`);
      expect(idx, `${targetPath} should render in-page`).toBeGreaterThan(-1);
      expect(
        idx,
        `${targetPath} should appear before the end-of-page related-tools list (i.e. in-context, inside a body section)`,
      ).toBeLessThan(relatedToolsIdx);
    }
  });

  it("GUIDE_SECTIONS still contains the exact headings the in-context links are keyed to (keeps the link block from silently going dark if content.ts is edited)", () => {
    const headings = GUIDE_SECTIONS.map((s) => s.heading);
    expect(headings).toContain("Hourly billing: paying for time, not for outcome");
    expect(headings).toContain("Flat fees: one price for a defined piece of work");
    expect(headings).toContain(
      "Contingency fees: the lawyer is paid only if you recover money",
    );
    expect(headings).toContain("What a lawyer's hour actually costs, state by state");
  });
});

describe("U-05 — calculator -> guide link (result area)", () => {
  const COST: LegalCostData = {
    id: "test-divorce-ca-moderate",
    category: "divorce",
    stateCode: "CA",
    complexity: "moderate",
    costRange: { low: 5900, median: 8000, high: 10600 },
    hourlyRate: { low: 250, median: 320, high: 450 },
    contingencyFee: null,
    typicalDuration: "6-12 months",
    commonFees: ["Filing fee", "Service of process"],
    sources: ["https://example.com/source-1", "https://example.com/source-2"],
    lastVerifiedAt: "2026-04-01",
  };

  it("CostResult renders a link to /how-legal-fees-work", () => {
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
    expect(html).toContain('href="/how-legal-fees-work"');
  });

  it("CostDetailsSection (the server-rendered result area present on every spoke page, curl/JS-off visible without a user-driven calculation) also links to /how-legal-fees-work", () => {
    const html = renderToStaticMarkup(
      createElement(CostDetailsSection, {
        categoryName: "Divorce",
        stateName: "California",
        commonFees: ["Filing fee", "Service of process"],
        hourlyRate: { low: 250, median: 320, high: 450 },
        typicalDuration: "6-12 months",
      }),
    );
    expect(html).toContain('href="/how-legal-fees-work"');
  });
});

describe("U-03 — sitemap lastmod reflects the guide's own real verification date", () => {
  it("the guide's sitemap entry lastModified matches GUIDE_UPDATED, not the unrelated cost-dataset date", () => {
    const entries = sitemap();
    const guideEntry = entries.find((e) => e.url.endsWith("/how-legal-fees-work"));
    expect(guideEntry).toBeDefined();

    const expected = new Date(`${GUIDE_UPDATED}T00:00:00Z`);
    const actual = guideEntry!.lastModified;
    const actualDate = actual instanceof Date ? actual : new Date(actual as string);
    expect(actualDate.toISOString()).toBe(expected.toISOString());
  });
});
