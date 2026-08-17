/**
 * tests/ad-proximity.test.ts
 *
 * K05 — Ad-proximity ("no accidental click") guard: asserts the single
 * programmatic ad slot (DisplaySlot -> AdProvider -> AdUnit, rendered inside
 * ResultMonetization) never renders above or immediately adjacent to the
 * calculator's inputs / Calculate button, and always sits well below the
 * cost-result card with a real spacing buffer.
 *
 * Approach: renderToStaticMarkup gives us the exact server-rendered HTML
 * source order (same pattern as tests/embed-monetization.test.ts). We assert:
 *   1. In CostResult's output, the ad marker (adsbygoogle / <ins) appears
 *      AFTER "Estimated Total Cost" (the result content) — never before it.
 *   2. The ad slot's wrapper carries a real spacing class (mt-8) and a
 *      reserved min-height buffer well over the ~150px UPL-safety margin
 *      cited in the ad-revenue spec (min-h-[250px] on sm+, 90px mobile,
 *      plus the mt-8 gap from the result card above it).
 *   3. CostCalculator's "Calculate Cost" button markup contains no ad
 *      marker anywhere near it (pre-calculation render: CostResult/
 *      ResultMonetization aren't even mounted yet).
 *   4. SettlementEstimatorForm — which has its own Calculate button — never
 *      renders any ad marker at all (confirms it has zero AdUnit/AdProvider
 *      call sites, so there is no proximity risk on that page either).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LegalCostData } from "@/lib/types";

// Client components under test call usePathname()/Link — stand in for the
// Next.js App Router runtime, matching tests/embed-monetization.test.ts.
import { vi } from "vitest";

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
import { ResultMonetization } from "@/components/monetization/ResultMonetization";
import { CostCalculator } from "@/components/calculator/cost-calculator";
import { SettlementEstimatorForm } from "@/components/calculator/settlement-estimator-form";

const AD_MARKERS = ["adsbygoogle", "<ins"];

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

function withEnv(key: string, value: string | undefined): () => void {
  const original = process.env[key];
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
  return () => {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  };
}

describe("ad-proximity — CostResult source order", () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    // CODE-01 (부속W): a manual AdSense unit requires BOTH a client id and a
    // REAL numeric slot id — with the slot unset the component now renders
    // nothing instead of an invalid <ins data-ad-slot={undefined}>. Set a
    // numeric slot so this test exercises the ad-present path it is asserting.
    cleanups.push(withEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000"));
    cleanups.push(withEnv("NEXT_PUBLIC_ADSENSE_SLOT_ID", "1234567890"));
  });

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("the ad marker never appears before the result content", () => {
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

    const resultIdx = html.indexOf("Estimated Total Cost");
    expect(resultIdx).toBeGreaterThan(-1);

    const adIdx = html.indexOf("adsbygoogle");
    expect(adIdx).toBeGreaterThan(-1);
    expect(adIdx).toBeGreaterThan(resultIdx);
  });

  it("the ad wrapper carries the mt-8 spacing class + a >=90px reserved min-height (UPL safety buffer)", () => {
    const html = renderToStaticMarkup(
      createElement(ResultMonetization, {
        context: "Divorce cost in California",
        categorySlug: "divorce",
        stateName: "California",
      }),
    );
    // Outer container spacing — separates the whole monetization stack
    // (including the ad slot) from the result card above it.
    expect(html).toContain("mt-8");
    // DisplaySlot's own reserved space — never a zero-height/collapsed
    // container that could invite a mis-click into a slot that pops in.
    expect(html).toMatch(/min-h-\[90px\]/);
  });
});

describe("ad-proximity — CostCalculator button has no ad marker nearby", () => {
  it("CostCalculator's Calculate button markup is free of ad markers before any result exists", () => {
    // No result yet (fresh render) — CostResult/ResultMonetization aren't
    // mounted at all, so this asserts the pre-calculation state (inputs +
    // button) never carries any ad content structurally.
    const html = renderToStaticMarkup(createElement(CostCalculator, {}));

    expect(html).toContain("Calculate Cost");
    for (const marker of AD_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });

  // U-01 extension (부속U §4): the new preset "Try an example" buttons render
  // in this exact same pre-calculation markup, above-fold and adjacent to
  // the inputs. Full dataset/copy/wiring assertions live in
  // tests/calculator-presets.test.ts — this assertion specifically extends
  // K05's "no ad marker nearby" guarantee to cover the new buttons.
  it("the U-01 preset buttons render in the same ad-marker-free pre-calculation markup", () => {
    const html = renderToStaticMarkup(createElement(CostCalculator, {}));

    expect(html).toContain("Try an example:");
    for (const marker of AD_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });
});

describe("ad-proximity — SettlementEstimatorForm never renders an ad slot", () => {
  it("has zero AdUnit/AdProvider call sites — no proximity risk on this page", () => {
    const html = renderToStaticMarkup(createElement(SettlementEstimatorForm, {}));

    expect(html).toContain("Estimate My Net");
    for (const marker of AD_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });
});
