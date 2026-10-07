import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import SettlementEstimatorPage from "@/app/settlement-estimator/page";
import CompareLayout from "@/app/compare/layout";
import ComparePage from "@/app/compare/page";
import { AFFILIATE_PARTNERS } from "@/lib/constants/affiliates";

const EMPTY_WRAPPER = /<(section|div)\b[^>]*>(\s*<div\b[^>]*>\s*<\/div>\s*)?<\/\1>/g;

function emptyWrappers(html: string): string[] {
  return (html.match(EMPTY_WRAPPER) ?? []).filter((m) => !/aria-hidden|aria-live|sr-only|data-|hidden|class="(?:[^"]*\s)?(?:h|w|size)-/.test(m));
}

const PAGES: Array<{ name: string; html: () => Promise<string> | string }> = [
  { name: "home", html: () => renderPage(HomePage) },
  { name: "matter page", html: () => renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" }) },
  { name: "settlement estimator", html: () => renderPage(SettlementEstimatorPage as never) },
  { name: "compare", html: () => renderToStaticMarkup(createElement(CompareLayout, null, createElement(ComparePage))) },
];

describe("UX P1-1(c): dormant affiliate slots leave no empty spacing band", () => {
  beforeEach(() => {
    for (const partner of AFFILIATE_PARTNERS) vi.stubEnv(partner.affiliateUrlEnvVar, "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  for (const page of PAGES) {
    it(`${page.name}: no empty section or div wrapper when no partner is configured`, async () => {
      expect(emptyWrappers(await page.html())).toEqual([]);
    });
  }

  it("a configured partner still renders its block with the advertiser disclosure on the home page and a matter page", async () => {
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL", "https://partner.example.com/x");
    for (const html of [
      await renderPage(HomePage),
      await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" }),
    ]) {
      expect(html).toContain("Legal Service Providers");
      expect(html).toContain("We may earn a commission");
      expect(html).toContain('href="https://partner.example.com/x"');
    }
  });

  it("positive control: the detector flags the old empty band", () => {
    const old = '<section class="py-16"><div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"></div></section>';
    expect(emptyWrappers(old)).toEqual([old]);
    expect(emptyWrappers('<div class="mt-8"></div>')).toEqual(['<div class="mt-8"></div>']);
  });
});
