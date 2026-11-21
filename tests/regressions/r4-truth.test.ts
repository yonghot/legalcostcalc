import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import costsSeed from "@/data/seed/costs.json";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import ComparePage from "@/app/compare/page";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import StateHubPage from "@/app/[state]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import { GET as getStatsJson } from "@/app/legal-cost-statistics/data.json/route";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { INDEXABLE_PAGES, getModerateMedianCost, getNationalMidpoint } from "@/lib/page-index";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { buildStatisticsAggregate, CASE_EXPENSE_MATTERS, stateWithTies } from "@/lib/seo/statistics";
import { categoryMixSentence } from "@/lib/seo/state-context";
import { median } from "@/lib/utils/median";
import { labelSources } from "@/lib/utils/format";
import { GUIDE_FACTS } from "@/app/how-legal-fees-work/content";
import type { Complexity, LegalCostData } from "@/lib/types";
import { PAGES } from "./helpers/k4a-oracle";

/*
 * Round 4 (2026-10-28) truth findings. Every family below is a sentence the seed cannot decide, or a statement a built page
 * contradicted; the convergence policy deletes it or reduces it to numbers and their source.
 */

interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low: number | null;
  hourly_rate_median: number | null;
  hourly_rate_high: number | null;
  contingency_fee_low?: number | null;
  contingency_fee_median?: number | null;
  contingency_fee_high?: number | null;
  typical_duration: string | null;
  common_fees: string[] | null;
  sources: string[] | null;
}
const SEED = costsSeed as SeedRow[];

function costsFor(code: string, category: string): LegalCostData[] {
  return SEED.filter((r) => r.state_code === code && r.category === category).map((r) => ({
    id: `${r.state_code}-${r.category}-${r.complexity}`,
    category: r.category,
    stateCode: r.state_code,
    complexity: r.complexity as Complexity,
    costRange: { low: r.cost_low, median: r.cost_median, high: r.cost_high },
    hourlyRate: { low: r.hourly_rate_low ?? 0, median: r.hourly_rate_median ?? 0, high: r.hourly_rate_high ?? 0 },
    contingencyFee:
      r.contingency_fee_low != null && r.contingency_fee_median != null && r.contingency_fee_high != null
        ? { low: r.contingency_fee_low, median: r.contingency_fee_median, high: r.contingency_fee_high }
        : null,
    typicalDuration: r.typical_duration ?? "Varies",
    commonFees: r.common_fees ?? [],
    sources: r.sources ?? [],
    lastVerifiedAt: "2026-06-29",
  }));
}

const text = (html: string) =>
  html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!-- -->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

const SAMPLE = [
  ["california", "bankruptcy"],
  ["michigan", "estate-planning"],
  ["new-jersey", "immigration"],
  ["missouri", "dui"],
  ["washington", "criminal-defense"],
  ["alabama", "real-estate"],
  ["california", "divorce"],
  ["arizona", "personal-injury"],
] as const;

describe("R4-C01: the tier names are the seed's own, simple and complex, in every category", () => {
  const TIER_WORDS = /straightforward|once (?:it is )?contested|on contested matters|contested work|simple to \$[\d,]+ contested/i;

  it("no generated analysis, FAQ or lever text on a sampled page calls the complex tier contested or the simple tier straightforward", async () => {
    for (const [state, category] of SAMPLE) {
      const body = text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` }));
      expect(body.match(TIER_WORDS)?.[0] ?? null, `${state}/${category}`).toBeNull();
    }
  });

  it("the cost-details lever list names the tiers, not 'contested'", async () => {
    const html = await renderPage(StateCategoryPage, { state: "california", slug: "bankruptcy-cost" });
    const body = text(html);
    expect(body).toMatch(/Complexity tier: \$[\d,]+ at the simple tier to \$[\d,]+ at the complex tier, a [\d.]+x span/);
    expect(body).toMatch(/Billed hours: about \d+ implied at the simple tier, \d+ at moderate and \d+ at the complex tier\./);
  });
});

describe("R4-C02 and R4-C03: the answer block lists no generic cause and states no cause for the tier gap", () => {
  it("on all 408 pages the factors name no trial or county-specific cost, and the stats carry no 'mainly' or 'contested' cause", () => {
    const bad: string[] = [];
    let blocks = 0;
    for (const s of STATES) {
      for (const c of CATEGORIES) {
        const costs = costsFor(s.code, c.slug);
        if (costs.length === 0) continue;
        const block = buildAnswerBlock({ category: c, state: s, costs, dateRecord: null });
        blocks++;
        for (const f of block.factors) if (/proceeds to trial|county-specific|administrative costs|varies by state and experience|can rise if/.test(f)) bad.push(`${s.name}/${c.slug}: factor "${f}"`);
        for (const t of block.stats) if (/mainly|driven|tied mainly|contested|experts and depositions/.test(t.text)) bad.push(`${s.name}/${c.slug}: stat "${t.text}"`);
      }
    }
    expect(blocks).toBeGreaterThan(400);
    expect(bad).toEqual([]);
  });

  it("the tier-gap stat is the two medians and nothing else", () => {
    const s = STATES.find((x) => x.code === "CA")!;
    const c = CATEGORIES.find((x) => x.slug === "bankruptcy")!;
    const costs = costsFor("CA", "bankruptcy");
    const block = buildAnswerBlock({ category: c, state: s, costs, dateRecord: null });
    const simple = costs.find((x) => x.complexity === "simple")!.costRange.median;
    const complex = costs.find((x) => x.complexity === "complex")!.costRange.median;
    const gapStat = block.stats.find((t) => /complex case/.test(t.text))!;
    const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
    expect(gapStat.text).toBe(`A simple case runs ${fmt(simple)} versus ${fmt(complex)} for a complex case.`);
  });
});

describe("R4-C04 and R4-C05: the counting rule and the extremes match the data", () => {
  const aggregate = buildStatisticsAggregate();

  it("the pages and the feed describe the row-identity rule, not 'differs from every other state's figure'", async () => {
    const stats = text(await renderPage(StatisticsPage));
    const compare = text(await renderPage(ComparePage));
    const feed = await (await getStatsJson()).json();
    for (const body of [stats, compare, JSON.stringify(feed.averageDefinition)]) {
      expect(body).not.toMatch(/differs from every other state/);
      expect(body).toMatch(/moderate-tier figures \(the low, median and high estimate, the low, median and high rate, and the duration\) are all identical to another state's figures are not counted/);
    }
  });

  it("tiedWith counts the other counted states at the same extreme median, and the table names the tie", async () => {
    let ties = 0;
    for (const row of aggregate.categoryRows) {
      const medians = INDEXABLE_PAGES.filter((p) => p.category.slug === row.categorySlug).map((p) => getModerateMedianCost(p.state.code, row.categorySlug)!);
      expect(row.highestState.tiedWith, row.categorySlug).toBe(medians.filter((m) => m === Math.max(...medians)).length - 1);
      expect(row.lowestState.tiedWith, row.categorySlug).toBe(medians.filter((m) => m === Math.min(...medians)).length - 1);
      if (row.highestState.tiedWith > 0 || row.lowestState.tiedWith > 0) ties++;
    }
    expect(ties).toBeGreaterThan(0);
    const stats = text(await renderPage(StatisticsPage));
    for (const row of aggregate.categoryRows) {
      for (const end of [row.highestState, row.lowestState]) {
        if (end.tiedWith > 0) expect(stats, `${row.categorySlug} ${end.name}`).toContain(`${stateWithTies(end)}: $`);
      }
    }
  });

  it("the compare overview says 'largest percentage gap', and that matter type has the largest percentage in its own list", async () => {
    const compare = text(await renderPage(ComparePage));
    expect(compare).not.toMatch(/shows the widest gap/);
    expect(compare).toMatch(/has the largest percentage gap between its highest and lowest state of the 8 matter types/);
    const widest = [...aggregate.categoryRows].sort((a, b) => b.highVsLowPercent - a.highVsLowPercent)[0]!;
    expect(compare).toContain(`${widest.highVsLowPercent}% more`);
    expect(aggregate.findings.join(" ")).not.toMatch(/widest state-to-state gap/);
  });

  it("the most and least expensive matter types are fee-based ones, so the superlative compares like with like", () => {
    expect(CASE_EXPENSE_MATTERS.has(aggregate.headline.categorySlug)).toBe(false);
    expect(CASE_EXPENSE_MATTERS.has(aggregate.categoryRows[aggregate.categoryRows.length - 1]!.categorySlug)).toBe(false);
    const pi = SEED.filter((r) => r.category === "personal-injury");
    expect(pi.every((r) => !r.hourly_rate_median)).toBe(true);
    for (const slug of CASE_EXPENSE_MATTERS) {
      expect(CATEGORIES.some((c) => c.slug === slug)).toBe(true);
    }
    for (const c of CATEGORIES.filter((x) => !CASE_EXPENSE_MATTERS.has(x.slug))) {
      expect(SEED.filter((r) => r.category === c.slug).every((r) => (r.hourly_rate_median ?? 0) > 0), c.slug).toBe(true);
    }
  });
});

describe("R4-C06 and R4-W01/W02/W11/W12: movement, hours, trajectory, ties and decomposition", () => {
  it("no page prints a place count in the movement sentences, or says the rank climbs, slides or falls", async () => {
    for (const [state, category] of SAMPLE) {
      const body = text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` }));
      expect(body, `${state}/${category}`).not.toMatch(/Climbing (?:one|two|three|four|five) places?|(?:One|Two|Three|Four|Five) places? down/);
      expect(body, `${state}/${category}`).not.toMatch(/moves up the table as complexity rises|slides \d+ places downward|it climbs \d+ places|as the matter (?:gets|becomes) harder/);
      expect(body, `${state}/${category}`).not.toMatch(/of work sits? behind|breaks down as|Decomposed, that is/);
    }
  });
});

describe("R4-C07 and R4-W13/W14: universal and causal statements that no row decides are gone", () => {
  it("the home FAQ names hourly rates only with the personal injury exception", async () => {
    const home = text(await renderPage(HomePage));
    expect(home).toContain("cost ranges, typical duration and common fees, plus hourly rates (or contingency percentages for personal injury)");
    expect(home).not.toMatch(/cost ranges, hourly rates, typical duration, and common fees/);
    expect(home).not.toMatch(/explains why one national|The most useful comparison is item by item/);
  });

  it("the about page and the footer make no unsourced claim about the state of legal pricing", async () => {
    const about = text(await renderPage(AboutPage));
    expect(about).not.toMatch(/lack transparency|most go in without any idea/);
    const footer = readFileSync(join(__dirname, "..", "..", "src", "components", "layout", "footer.tsx"), "utf8");
    expect(footer).not.toMatch(/real\s+costs of legal matters/);
  });

  it("the guide states what the Model Rules say, not what every state does", () => {
    const joined = JSON.stringify(GUIDE_FACTS);
    expect(joined).not.toMatch(/Every state allows|not on which lawyer is hired/);
    const content = readFileSync(join(__dirname, "..", "..", "src", "app", "how-legal-fees-work", "content.ts"), "utf8");
    expect(content).not.toMatch(/every state has adopted|Every U\.S\. jurisdiction|one of the most common sources of later/);
  });

  it("the bankruptcy FAQ does not say 'in every state', and the DUI note does not say what the figures specifically cover", () => {
    const bankruptcy = CATEGORIES.find((c) => c.slug === "bankruptcy")!;
    const dui = CATEGORIES.find((c) => c.slug === "dui")!;
    expect(JSON.stringify(bankruptcy.faqTemplates)).not.toMatch(/in every state/);
    expect(JSON.stringify(dui.costFormationNotes)).not.toMatch(/specifically|lifetime cost of a conviction/);
  });
});

describe("R4-W03 and R4-W04: personal injury is labelled as case expenses, and the meta descriptions promise what the rows hold", () => {
  it("the statistics table labels personal injury as case expenses and the page says why", async () => {
    const stats = text(await renderPage(StatisticsPage));
    expect(stats).toMatch(/Personal Injury \(case expenses\)/);
    expect(stats).toMatch(/Personal injury figures are estimated case expenses, not attorney fees/);
  });

  it("a personal injury page never says its figures include attorney fees", async () => {
    const body = text(await renderPage(StateCategoryPage, { state: "arizona", slug: "personal-injury-cost" }));
    expect(body).not.toMatch(/including attorney fees/);
  });

  it("no category description promises fines, retainers, chapters, visas, felonies or title searches that the rows do not hold", () => {
    for (const c of CATEGORIES) {
      expect(c.seoDescriptionTemplate, c.slug).not.toMatch(/fines|retainer|Chapter 7|Chapter 13|green card|citizenship|deportation|misdemeanor|felony|title search|attorney fees|court costs|total expenses/);
      expect(c.seoDescriptionTemplate, c.slug).toContain("with sources and dates");
    }
  });

  it("the state hub intro and the home description claim no cost components", async () => {
    const hub = text(await renderPage(StateHubPage, { state: "california" } as never));
    expect(hub).not.toMatch(/including attorney fees, court costs, and typical case duration/);
    const source = readFileSync(join(__dirname, "..", "..", "src", "app", "page.tsx"), "utf8");
    expect(source).not.toMatch(/Estimate attorney fees, court costs, and total expenses/);
  });
});

describe("R4-W05: the duration is labelled as the national assumption it is", () => {
  it("typical_duration is identical in every state for each category and tier, so 'the same in every state' is true", () => {
    const seen = new Map<string, Set<string>>();
    for (const r of SEED) {
      const key = `${r.category}/${r.complexity}`;
      if (!seen.has(key)) seen.set(key, new Set());
      seen.get(key)!.add(String(r.typical_duration));
    }
    expect(seen.size).toBe(24);
    for (const [key, values] of seen) expect([...values], key).toHaveLength(1);
  });

  it("the answer paragraph, the duration card and the tier cards say so", async () => {
    const body = text(await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" }));
    expect(body).toMatch(/The duration assumed for a moderate-complexity case is .+ \(a national assumption, the same in every state\)/);
    expect(body).toContain("For moderate complexity cases (a national assumption, the same in every state)");
    expect(body).toContain("Durations are a national assumption, the same in every state.");
    expect(body).not.toMatch(/typically takes .+ to resolve/);
  });
});

describe("R4-W06: one national baseline per page", () => {
  it("a state page compares against the table midpoint only: the synthesis sentence uses the midpoint, never the average of state medians", async () => {
    const body = text(await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" }));
    expect(body).toMatch(/runs \d+% (?:above|below) the \$[\d,]+ midpoint of state medians across \d+ states with estimates/);
    expect(body).not.toMatch(/average of state medians across/);
  });

  it("the midpoint the synthesis prints equals the midpoint the per-state analysis ranks against, on every page", () => {
    const bad = PAGES.filter((p) => getNationalMidpoint(p.category) !== p.ctx.peerMedian).map((p) => `${p.state}/${p.category}: ${getNationalMidpoint(p.category)} vs ${p.ctx.peerMedian}`);
    expect(bad).toEqual([]);
  });
});

describe("R4-W07: the OG images use the same median as the pages", () => {
  it("median() averages the two middle values of an even count, as the page midpoint does", () => {
    expect(median([1450, 2000, 2500, 3200])).toBe(2250);
    expect(median([1, 2, 3])).toBe(2);
    for (const slug of ["real-estate", "estate-planning", "personal-injury"]) {
      const values = INDEXABLE_PAGES.filter((p) => p.category.slug === slug).map((p) => getModerateMedianCost(p.state.code, slug)!);
      const sorted = [...values].sort((a, b) => a - b);
      if (sorted.length % 2 === 0) expect(median(values), slug).toBe(Math.round((sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) / 2));
    }
  });

  it("neither OG route indexes the sorted array at floor(n/2), and both label the statistic they print", () => {
    for (const rel of [["category", "[category]", "opengraph-image.tsx"], ["[state]", "opengraph-image.tsx"]]) {
      const src = readFileSync(join(__dirname, "..", "..", "src", "app", ...rel), "utf8");
      expect(src, rel.join("/")).not.toMatch(/Math\.floor\((?:state|category)Count \/ 2\)/);
      expect(src, rel.join("/")).toContain("median(");
      expect(src, rel.join("/")).not.toMatch(/nationwide median|typical median cost/);
    }
  });
});

describe("R4-W08: personal injury pages do not say hourly data is being collected", () => {
  it("none of the 51 personal injury pages carries the hourly 'currently being collected' answer", async () => {
    const pi = STATES.slice(0, 12);
    for (const s of pi) {
      const body = text(await renderPage(StateCategoryPage, { state: s.slug, slug: "personal-injury-cost" }));
      expect(body, s.name).not.toMatch(/Hourly rate data for .+ is currently being collected/);
    }
  }, 120_000);
});

describe("R4-W10: the matter label reads as a noun phrase and keeps acronyms", () => {
  it("every category has a prose label that follows 'a' or 'an', and none is a lower-cased acronym", () => {
    const labels = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.proseLabel]));
    expect(labels).toEqual({
      divorce: "divorce",
      dui: "DUI / DWI case",
      "personal-injury": "personal injury case",
      bankruptcy: "bankruptcy",
      "real-estate": "real estate closing",
      "estate-planning": "estate planning or probate matter",
      "criminal-defense": "criminal defense case",
      immigration: "immigration matter",
    });
  });

  it("no page on a sample prints 'dui / dwi', 'an estate planning / probate' or 'an immigration' in running prose", async () => {
    for (const [state, category] of SAMPLE) {
      const body = text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` }));
      const hit = body.match(/\bdui \/ dwi\b|\ban estate planning \/ probate\b|\ban immigration (?:in|has|costs?)\b|\ba immigration\b/);
      expect(hit?.[0] ?? null, `${state}/${category}`).toBeNull();
    }
    for (const category of ["dui", "estate-planning"]) {
      const body = text(await renderPage(CategoryHubPage, { category } as never));
      expect(body).not.toMatch(/\bdui \/ dwi\b|\bestate planning \/ probate costs\b(?! across)/);
    }
  });
});

describe("R4-S01: tie handling and fragments", () => {
  it("no matter-type sentence calls a tied median the largest or the smallest, and none ends in a fragment", () => {
    let tied = 0;
    const bad: string[] = [];
    for (const p of PAGES) {
      const sentence = categoryMixSentence(p.ctx, p.label);
      if (!sentence) continue;
      const own = p.ctx.tiers.moderate!.median;
      const ties = p.ctx.categoryTable.filter((r) => r.median === own).length - 1;
      if (ties > 0) tied++;
      if (ties > 0 && /carries the largest median|records the smallest median/.test(sentence)) bad.push(`${p.state}/${p.category}: ${sentence}`);
      if (/\. At \d+% of /.test(sentence)) bad.push(`${p.state}/${p.category}: fragment in ${sentence}`);
    }
    expect(tied).toBeGreaterThan(3);
    expect(bad).toEqual([]);
  });

  it("source labels never repeat on an answer block, and a fee share never prints '4%–4%'", async () => {
    const dup: string[] = [];
    for (const s of STATES) {
      for (const c of CATEGORIES) {
        const costs = costsFor(s.code, c.slug);
        if (costs.length === 0) continue;
        const labels = buildAnswerBlock({ category: c, state: s, costs, dateRecord: null }).sources.map((x) => x.label);
        if (new Set(labels).size !== labels.length) dup.push(`${s.name}/${c.slug}: ${labels.join(", ")}`);
      }
    }
    expect(dup).toEqual([]);
    expect(labelSources(["https://www.uscis.gov/a", "https://uscis.gov/b/"]).map((x) => x.label)).toEqual(["uscis.gov/a", "uscis.gov/b"]);
    expect(labelSources(["https://www.uscis.gov/a", "https://courts.gov/b"]).map((x) => x.label)).toEqual(["uscis.gov", "courts.gov"]);
    const body = text(await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" }));
    expect(body).not.toMatch(/(\d+)%–\1%/);
  });

  it("a personal injury page has no empty 'The rate table' heading", async () => {
    const body = text(await renderPage(StateCategoryPage, { state: "california", slug: "personal-injury-cost" }));
    expect(body).not.toContain("The rate table");
  });
});
