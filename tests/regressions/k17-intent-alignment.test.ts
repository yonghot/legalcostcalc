import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import { resolveTitle } from "./helpers/title";
import HomePage from "@/app/page";
import GuidePage, { metadata as guideMetadata } from "@/app/how-legal-fees-work/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import StateHubPage from "@/app/[state]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import { metadata as rootMetadata } from "@/app/layout";
import { GUIDE_FACTS } from "@/app/how-legal-fees-work/content";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { formatCurrency } from "@/lib/utils/format";

const ROOT = rootMetadata.title as { default: string; template: string };

const textOf = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

function afterH1(html: string, words: number): string {
  const at = html.indexOf("</h1>");
  expect(at).toBeGreaterThan(-1);
  return textOf(html.slice(at + 5))
    .split(" ")
    .slice(0, words)
    .join(" ");
}

const h1Of = (html: string) => textOf((html.match(/<h1[\s\S]*?<\/h1>/) ?? [""])[0]);

const FIGURE = /\$\d[\d,]*/;
const CONDITION = /\b(depends?|varies|vary|typically|moderate-complexity)\b/i;
const SOURCE = /Clio's 2025 Legal Trends Report|modeled estimate from published fee guides/;
const QUERY_PHRASE = /legal (?:fees|costs)/gi;

const hourlyFact = GUIDE_FACTS.find((f) => /average lawyer hourly rate/i.test(f.fact));

async function pages() {
  return {
    home: await renderPage(HomePage),
    guide: await renderPage(GuidePage),
    ny: await renderPage(StateCategoryPage, { state: "new-york", slug: "divorce-cost" } as never),
    ca: await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never),
  };
}

describe("K17/K23: the first 100 words answer the query with a figure, a condition and a source", () => {
  it.each(["home", "guide", "ny", "ca"] as const)("%s", async (key) => {
    const first100 = afterH1((await pages())[key], 100);
    expect(first100, "figure").toMatch(FIGURE);
    expect(first100, "condition").toMatch(CONDITION);
    expect(first100, "source label").toMatch(SOURCE);
    expect(first100, "typography").not.toMatch(/[^.]\.\.(?!\.)/);
  });

  it("the phrase 'legal fees' / 'legal costs' is not repeated more than twice in the first 150 words", async () => {
    const all = await pages();
    for (const key of ["home", "guide"] as const) {
      const first150 = afterH1(all[key], 150);
      expect((first150.match(QUERY_PHRASE) ?? []).length, key).toBeLessThanOrEqual(2);
    }
  });
});

describe("K17: the figures in the lead are the already sourced ones", () => {
  it("the hourly-rate benchmark is the Clio fact the guide already cites", () => {
    expect(hourlyFact).toBeDefined();
    expect(hourlyFact?.sourceUrl).toContain("clio.com");
    expect(hourlyFact?.fact).toContain("$349");
  });

  it("home and guide state that same benchmark with its report year, and nothing else from outside the dataset", async () => {
    const all = await pages();
    for (const key of ["home", "guide"] as const) {
      const first100 = afterH1(all[key], 100);
      expect(first100, key).toContain("$349");
      expect(first100, key).toContain("Clio's 2025 Legal Trends Report");
    }
  });

  it("the home answer quotes the same category averages as the statistics page", async () => {
    const { categoryRows } = buildStatisticsAggregate();
    const highest = categoryRows[0];
    const lowest = categoryRows[categoryRows.length - 1];
    const first100 = afterH1((await pages()).home, 100);
    expect(first100).toContain(formatCurrency(highest.nationalAverage));
    expect(first100).toContain(formatCurrency(lowest.nationalAverage));
    expect(first100.toLowerCase()).toContain(highest.categoryDisplayName.toLowerCase());
    expect(first100.toLowerCase()).toContain(lowest.categoryDisplayName.toLowerCase());
  });
});

describe("K17: title, description and H1 carry the query intent", () => {
  it("the home title names legal fees or legal costs and fits 60 characters", () => {
    const title = resolveTitle(undefined, ROOT);
    expect(title).toMatch(/legal (?:fees|costs)/i);
    expect(title.length).toBeLessThanOrEqual(60);
    expect(title).not.toContain("Really Cost");
  });

  it("the guide title names legal fees and fits 60 characters", () => {
    const title = resolveTitle(guideMetadata.title, ROOT);
    expect(title).toMatch(/legal fees/i);
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it.each([
    ["home", () => String(rootMetadata.description)],
    ["guide", () => String(guideMetadata.description)],
  ])("%s meta description states the benchmark and stays within 160 characters", (_name, get) => {
    const description = get();
    expect(description).toMatch(FIGURE);
    expect(description).toMatch(/legal (?:fees|costs)/i);
    expect(description).toMatch(/Clio/);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it("home and guide H1s name the query", async () => {
    const all = await pages();
    expect(h1Of(all.home)).toMatch(/legal (?:fees|costs)/i);
    expect(h1Of(all.guide)).toMatch(/legal fees/i);
  });
});

describe("K24: the home page and the hubs point at the fees guide", () => {
  it("home, a state hub and a category hub link to /how-legal-fees-work", async () => {
    const hrefs = [
      await renderPage(HomePage),
      await renderPage(StateHubPage, { state: "texas" }),
      await renderPage(CategoryHubPage, { category: "divorce" }),
    ];
    for (const html of hrefs) expect(html).toContain('href="/how-legal-fees-work"');
  });
});

describe("K17: the divorce pages with search impressions describe the figure as a modeled estimate", () => {
  it.each(["ny", "ca"] as const)("%s divorce answer", async (key) => {
    const first100 = afterH1((await pages())[key], 100);
    expect(first100).toMatch(/a modeled estimate from published fee guides/);
    expect(first100).not.toMatch(/based on sourced/i);
  });
});
