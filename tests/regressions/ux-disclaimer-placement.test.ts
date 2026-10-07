import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import StateHubPage from "@/app/[state]/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import CompareLayout from "@/app/compare/layout";
import ComparePage from "@/app/compare/page";
import DivorceHubPage from "@/app/divorce-cost-by-state/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import EmbedIndexPage from "@/app/embed/page";
import SettlementEstimatorPage from "@/app/settlement-estimator/page";
import { Footer } from "@/components/layout/footer";
import { CostResult } from "@/components/calculator/cost-result";
import { DISCLAIMER_SHORT, DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";
import type { LegalCostData } from "@/lib/types";

const COST: LegalCostData = {
  id: "ux-disclaimer-ma-moderate",
  category: "bankruptcy",
  stateCode: "MA",
  complexity: "moderate",
  costRange: { low: 2000, median: 4400, high: 9000 },
  hourlyRate: { low: 250, median: 350, high: 450 },
  typicalDuration: "4-6 months",
  commonFees: ["Court filing fee", "Credit counseling course"],
  sources: ["https://example.com/a", "https://example.com/b"],
  lastVerifiedAt: "2026-04-01",
};

const PAGES: Array<{ name: string; html: () => Promise<string> | string }> = [
  { name: "home", html: () => renderPage(HomePage) },
  { name: "state/matter page", html: () => renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" }) },
  { name: "state hub", html: () => renderPage(StateHubPage, { state: "florida" }) },
  { name: "category hub", html: () => renderPage(CategoryHubPage, { category: "bankruptcy" }) },
  { name: "compare", html: () => renderToStaticMarkup(createElement(CompareLayout, null, createElement(ComparePage))) },
  { name: "divorce hub", html: () => renderPage(DivorceHubPage as never) },
  { name: "statistics", html: () => renderPage(StatisticsPage as never) },
  { name: "fees guide", html: () => renderPage(GuidePage as never) },
  { name: "about", html: () => renderPage(AboutPage as never) },
  { name: "contact", html: () => renderPage(ContactPage as never) },
  { name: "privacy", html: () => renderPage(PrivacyPage as never) },
  { name: "terms", html: () => renderPage(TermsPage as never) },
  { name: "embed index", html: () => renderPage(EmbedIndexPage as never) },
  { name: "settlement estimator", html: () => renderPage(SettlementEstimatorPage as never) },
];

function count(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

describe("UX P0-1(a) / D2: one line and a link on the first screen, the full text once below the content", () => {
  for (const page of PAGES) {
    it(`${page.name}: the part before the H1 holds the one-line summary and a link, not the full text`, async () => {
      const html = await page.html();
      const head = html.slice(0, html.indexOf("<h1"));
      expect(head.length).toBeGreaterThan(0);
      expect(head).toContain(DISCLAIMER_SHORT);
      expect(head).toContain('href="#disclaimer"');
      expect(head).not.toContain(DISCLAIMER_TEXT);
    });

    it(`${page.name}: the full text appears once on the page, under the anchor the link points to`, async () => {
      const html = await page.html();
      expect(count(html, DISCLAIMER_TEXT)).toBe(1);
      expect(count(html, 'id="disclaimer"')).toBe(1);
      const anchored = html.slice(html.indexOf('id="disclaimer"'));
      expect(anchored.slice(0, anchored.indexOf(DISCLAIMER_TEXT) + DISCLAIMER_TEXT.length)).toContain("<p");
      expect(html.indexOf('id="disclaimer"')).toBeGreaterThan(html.indexOf("<h1"));
    });
  }

  it("the matter page puts the full text directly under the result and its next steps, ahead of the calculator", async () => {
    const html = await renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" });
    const full = html.indexOf('id="disclaimer"');
    expect(full).toBeGreaterThan(html.indexOf('data-next-step="answer"'));
    expect(full).toBeLessThan(html.indexOf("Calculate Your Estimated Cost"));
    expect(html.indexOf("(Moderate Complexity)")).toBeLessThan(full);
  });

  it("the home page keeps the full text ahead of the FAQ", async () => {
    const html = await renderPage(HomePage);
    expect(html.indexOf('id="disclaimer"')).toBeLessThan(html.indexOf("Frequently Asked Questions"));
  });

  it("the footer still carries the full text on every page", () => {
    expect(renderToStaticMarkup(createElement(Footer))).toContain(DISCLAIMER_TEXT);
  });

  it("a calculated result does not repeat the page-level text above the card; the result-adjacent notice stays", () => {
    const html = renderToStaticMarkup(
      createElement(CostResult, { results: [COST], stateName: "Massachusetts", categoryName: "Bankruptcy" }),
    );
    expect(html).not.toContain(DISCLAIMER_TEXT);
    expect(html).toContain("no attorney-client relationship is created by using this tool");
  });
});

describe("D2: every page that links to the full text also renders it", () => {
  const appDir = path.resolve(__dirname, "..", "..", "src", "app");
  function pageFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir)) {
      const p = path.join(dir, entry);
      if (statSync(p).isDirectory()) pageFiles(p, out);
      else if (entry === "page.tsx") out.push(p);
    }
    return out;
  }

  it("a page source with DisclaimerNote has exactly one Disclaimer with id disclaimer", () => {
    const noted = pageFiles(appDir).filter((f) => readFileSync(f, "utf8").includes("<DisclaimerNote"));
    expect(noted.length).toBeGreaterThanOrEqual(13);
    for (const file of noted) {
      const src = readFileSync(file, "utf8");
      expect(src.match(/<Disclaimer id="disclaimer"/g)?.length, file).toBe(1);
      expect(src.match(/<Disclaimer \/>|<Disclaimer variant="full" \/>/g), file).toBeNull();
    }
  });
});
