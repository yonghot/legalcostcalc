import { describe, expect, it } from "vitest";
import seed from "@/data/seed/costs.json";
import { renderPage } from "./helpers/render";
import { CATEGORIES } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getNationalAverage } from "@/lib/page-index";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { formatCurrency } from "@/lib/utils/format";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { GET as getJson } from "@/app/legal-cost-statistics/data.json/route";
import { GET as getCsv } from "@/app/legal-cost-statistics/data.csv/route";

type SeedRow = { category: string; state_code: string; complexity: string; cost_median: number };
const SEED = seed as unknown as SeedRow[];

function independentAverage(categorySlug: string): { mean: number; count: number } {
  const states = new Set(INDEXABLE_PAGES.filter((p) => p.category.slug === categorySlug).map((p) => p.state.code));
  const values = SEED.filter(
    (r) => r.category === categorySlug && r.complexity === "moderate" && r.cost_median > 0 && states.has(r.state_code),
  ).map((r) => r.cost_median);
  return { mean: values.reduce((sum, v) => sum + v, 0) / values.length, count: values.length };
}

const LD_JSON = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

function datasetNode(html: string): { variableMeasured?: Array<{ name: string; value: number; description: string }> } {
  const nodes = [...html.matchAll(LD_JSON)].map((m) => JSON.parse(m[1]) as { "@type"?: string });
  const node = nodes.find((n) => n["@type"] === "Dataset");
  if (!node) throw new Error("no Dataset JSON-LD on the statistics page");
  return node as { variableMeasured?: Array<{ name: string; value: number; description: string }> };
}

describe("K4: every statistics surface shows the average of the population it states", () => {
  const aggregate = buildStatisticsAggregate();

  it.each(CATEGORIES.map((c) => [c.slug]))("%s: the published average is the mean of the counted states", (slug) => {
    const row = aggregate.categoryRows.find((r) => r.categorySlug === slug)!;
    const expected = independentAverage(slug);
    expect(row.stateCount).toBe(expected.count);
    expect(row.nationalAverage).toBe(Math.round(expected.mean));
    expect(Math.round(getNationalAverage(slug)!)).toBe(Math.round(expected.mean));
  });

  it("page table, data.json, data.csv and Dataset JSON-LD carry the same figures", async () => {
    const html = await renderPage(StatisticsPage);
    const json = (await (await getJson()).json()) as {
      categories: Array<{ category: string; nationalAverageMedianCost: number; stateCount: number }>;
    };
    const csvLines = (await (await getCsv()).text()).trim().split("\n").slice(1);
    const ld = datasetNode(html);

    for (const row of aggregate.categoryRows) {
      const expected = Math.round(independentAverage(row.categorySlug).mean);
      expect(html).toContain(formatCurrency(expected));
      const j = json.categories.find((c) => c.category === row.categorySlug)!;
      expect(j.nationalAverageMedianCost).toBe(expected);
      expect(j.stateCount).toBe(row.stateCount);
      const csvRow = csvLines.find((l) => l.startsWith(`${row.categorySlug},`))!.split(",");
      expect(Number(csvRow[2])).toBe(expected);
      expect(Number(csvRow[3])).toBe(row.stateCount);
      const measured = ld.variableMeasured?.find((v) => v.name.includes(row.categoryDisplayName));
      expect(measured?.value, row.categorySlug).toBe(expected);
      expect(measured?.description).toContain(`${row.stateCount} states`);
    }
  });

  it("the page says what is averaged and over which states, and does not call the average a median", async () => {
    const html = (await renderPage(StatisticsPage)).replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ");
    expect(html).toMatch(/average of (?:the )?state median/i);
    expect(html).toMatch(/states? (?:with|whose)/i);
    expect(html).not.toMatch(/national median/i);
    expect(aggregate.findings.join(" ")).not.toMatch(/with a median cost of/i);
    for (const finding of aggregate.findings.slice(0, 2)) expect(finding).toMatch(/average state median/i);
  });

  it("state pages quote the same average without claiming all 50 states and DC", async () => {
    const row = aggregate.categoryRows.find((r) => r.categorySlug === "personal-injury")!;
    const html = await renderPage(StateCategoryPage, { state: "texas", slug: "personal-injury-cost" });
    expect(html).toContain(formatCurrency(row.nationalAverage));
    expect(html).not.toMatch(/across all 50 states and DC/);
    expect(html).toContain(`${row.stateCount} states`);
  });
});
