import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./helpers/render";
import CompareLayout from "@/app/compare/layout";
import ComparePage from "@/app/compare/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { formatCurrency } from "@/lib/utils/format";

const SCRIPT_OR_STYLE = /<(script|style)\b[\s\S]*?<\/\1>/gi;

function visibleText(html: string): string {
  return html
    .replace(SCRIPT_OR_STYLE, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

const wordCount = (html: string) => visibleText(html).split(" ").filter((w) => /[A-Za-z0-9]/.test(w)).length;

const compareHtml = () => renderToStaticMarkup(createElement(CompareLayout, null, createElement(ComparePage)));
const overviewOf = (html: string) =>
  html.match(/<section[^>]*aria-labelledby="compare-overview-heading"[\s\S]*?<\/section>/)?.[0] ?? "";

const aggregate = buildStatisticsAggregate();

describe("K8 non-target: /compare is a tool page with a real server-rendered comparison", () => {
  it("static HTML carries at least 300 words of page content, not a 106-word shell", () => {
    expect(wordCount(compareHtml())).toBeGreaterThanOrEqual(300);
  });

  it("the comparison is its own section of at least 200 words", () => {
    const overview = overviewOf(compareHtml());
    expect(overview).not.toBe("");
    expect(wordCount(overview)).toBeGreaterThanOrEqual(200);
  });

  it("every matter type shows its highest and lowest state with the same figures as the statistics page", () => {
    const overview = visibleText(overviewOf(compareHtml()));
    const statistics = visibleText(renderToStaticMarkup(createElement("div", null, StatisticsPage())));
    expect(aggregate.categoryRows.length).toBe(8);
    for (const row of aggregate.categoryRows) {
      for (const [name, median] of [
        [row.highestState.name, row.highestState.median],
        [row.lowestState.name, row.lowestState.median],
      ] as const) {
        const figure = formatCurrency(median);
        expect(overview, `${row.categorySlug} ${name}`).toContain(name);
        expect(overview, `${row.categorySlug} ${figure}`).toContain(figure);
        expect(statistics, `${row.categorySlug} ${figure} on statistics`).toContain(figure);
      }
    }
  });

  it("the worked example names the widest spread, its two states, the dollar gap and the percentage", () => {
    const widest = [...aggregate.categoryRows].sort((a, b) => b.highVsLowPercent - a.highVsLowPercent)[0];
    const overview = visibleText(overviewOf(compareHtml()));
    const gap = formatCurrency(widest.highestState.median - widest.lowestState.median);
    expect(overview).toContain(`${widest.highestState.name} and ${widest.lowestState.name}`);
    expect(overview).toContain(gap);
    expect(overview).toContain(`${widest.highVsLowPercent}%`);
  });

  it("links every matter hub and states the method and the states counted", () => {
    const overview = overviewOf(compareHtml());
    for (const row of aggregate.categoryRows) expect(overview).toContain(`href="/category/${row.categorySlug}"`);
    const text = visibleText(overview);
    expect(text).toContain("modeled from published national fee guides and rate surveys");
    expect(text).toMatch(/states counted|States counted/);
  });

  it("keeps the interactive tool", () => {
    const html = compareHtml();
    expect(html).toContain("Compare Legal Costs");
    expect(html).toContain("Compare States");
    expect(html).toContain("Compare Categories");
  });
});
