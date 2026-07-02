/**
 * tests/embed-monetization.test.ts
 *
 * Embed-widget monetization invariant ("Ads are intentionally OFF here" —
 * src/app/embed/[state]/[slug]/page.tsx): the embeddable calculator is
 * iframed on third-party sites, where serving AdSense violates policy.
 *
 *   - ResultMonetization with monetizationDisabled renders NOTHING.
 *   - CostResult threads monetizationDisabled through: with
 *     NEXT_PUBLIC_ADSENSE_CLIENT_ID (and CTA/partner/sponsor env) set, its
 *     output contains no adsbygoogle class / <ins> element and no
 *     monetization content — while the result figures stay intact.
 *   - Sanity inverse: WITHOUT the flag the same render DOES contain the ad
 *     unit, proving the assertions above are meaningful.
 *   - The embed route's SSR output never contains adsbygoogle.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { LegalCostData } from "@/lib/types";

// The components under test are client components; outside the Next.js
// runtime the navigation/link modules need inert stand-ins.
vi.mock("next/navigation", () => ({
  usePathname: () => "/embed/california/divorce-cost",
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
import EmbedCalculatorPage from "@/app/embed/[state]/[slug]/page";

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function renderCostResult(monetizationDisabled: boolean | undefined): string {
  return renderToStaticMarkup(
    createElement(CostResult, {
      results: [COST],
      stateName: "California",
      categoryName: "Divorce",
      categorySlug: "divorce",
      stateCode: "CA",
      stateSlug: "california",
      monetizationDisabled,
    }),
  );
}

// Markers for every ResultMonetization block, so the disabled assertions
// cover the full stack, not just the AdSense unit:
const AD_MARKERS = ["adsbygoogle", "<ins"];
const MONETIZATION_MARKERS = [
  ...AD_MARKERS,
  "Free Consultation Available", // (a) PrimaryIntentCTA (call)
  "ExamplePartner", // (c) FeaturedPartnerTable
  "Sponsored", // (d) SponsorSlot
];

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("embed monetization gate (monetizationDisabled)", () => {
  const cleanups: Array<() => void> = [];

  beforeEach(() => {
    // Simulate a fully monetized production configuration.
    cleanups.push(
      withEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000"),
      withEnv("NEXT_PUBLIC_AD_PROVIDER", undefined), // default: adsense
      withEnv("NEXT_PUBLIC_PPC_NUMBER", "+18005551234"), // default CTA: call
      withEnv(
        "MON_FEATURED_PARTNERS",
        JSON.stringify([
          { label: "ExamplePartner", figure: "From $79", href: "https://partner.example.com" },
        ]),
      ),
      withEnv("NEXT_PUBLIC_SPONSOR_HTML", "Sponsored message from test"),
    );
  });

  afterEach(() => {
    for (const fn of cleanups.splice(0)) fn();
  });

  it("sanity: WITHOUT the flag, CostResult renders the AdSense unit and monetization blocks", () => {
    const html = renderCostResult(undefined);
    for (const marker of MONETIZATION_MARKERS) {
      expect(html).toContain(marker);
    }
  });

  it("ResultMonetization renders nothing at all when monetizationDisabled", () => {
    const html = renderToStaticMarkup(
      createElement(ResultMonetization, {
        context: "Divorce cost in California",
        categorySlug: "divorce",
        stateName: "California",
        monetizationDisabled: true,
      }),
    );
    expect(html).toBe("");
  });

  it("CostResult with monetizationDisabled contains no adsbygoogle/<ins> and no monetization content", () => {
    const html = renderCostResult(true);
    for (const marker of MONETIZATION_MARKERS) {
      expect(html).not.toContain(marker);
    }
  });

  it("CostResult with monetizationDisabled keeps the result figures fully intact", () => {
    const html = renderCostResult(true);
    expect(html).toContain("Estimated Total Cost");
    expect(html).toContain("Divorce Cost in California");
    expect(html).toContain("Typical Duration");
    expect(html).toContain("Data Sources:");
  });

  it("embed route SSR output contains no adsbygoogle even with the AdSense client id set", async () => {
    const jsx = await EmbedCalculatorPage({
      params: Promise.resolve({ state: "california", slug: "divorce-cost" }),
    });
    const html = renderToStaticMarkup(jsx);
    for (const marker of AD_MARKERS) {
      expect(html).not.toContain(marker);
    }
    // The widget itself still renders.
    expect(html).toContain("Powered by LegalCostCalc");
  });
});
