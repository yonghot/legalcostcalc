import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import { CATEGORIES } from "@/lib/constants/categories";
import HomePage from "@/app/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import EmbedPage from "@/app/embed/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";

const DEVELOPER_SPEAK = new RegExp(
  [
    String.raw`NEXT_PUBLIC_\w+|process\.env|\b[\w-]+\.(?:tsx?|json|mjs)\b`,
    String.raw`not streamed|bundled dataset|\bseed\b|this site's configuration`,
    String.raw`\brows?\b|passes SEO|busiest month`,
  ].join("|"),
  "gi",
);

const BROKEN_PROSE = new RegExp(
  [
    String.raw`(?<![\d.])1 (?:states|hours|places|months|matters|citations|estimates|days|weeks)\b`,
    String.raw`\$0 (?:clear|over|short|off|light|heavy|under|up|down|away|below|above|more|less|out)\b`,
    String.raw`a \$0 window|out by \$0|[−+]\$0\b`,
    String.raw`\b[A-Za-z]+court's`,
    String.raw`\ba (?:estate|immigration)\b|\ban (?:divorce|dui|personal|bankruptcy|real|criminal)\b`,
    String.raw`\b\d*[02-9][123]th\b`,
    String.raw`\bundefined\b|\bNaN\b|\[object|\$-\d|\$0(?!\d|,\d)|(?<![\d.])1 more hours|\b0 (?:states|places)\b|\b0 hours apart`,
  ].join("|"),
  "gi",
);

const DATASET_WORD = /\bdataset\b/gi;

const SCRIPT_OR_STYLE = /<(script|style)\b[\s\S]*?<\/\1>/gi;

function visibleText(html: string): string {
  return html
    .replace(SCRIPT_OR_STYLE, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

function matches(text: string, pattern: RegExp): string[] {
  const re = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  return [...text.matchAll(re)].map((m) => {
    const at = m.index ?? 0;
    return `${m[0]} :: ${text.slice(Math.max(0, at - 40), at + 60)}`;
  });
}

const pair = (state: string, slug: string): [string, () => Promise<string>] => [
  `/${state}/${slug}`,
  () => renderPage(StateCategoryPage, { state, slug }),
];

const TEMPLATE_PAGES: Array<[string, () => Promise<string>]> = [
  pair("california", "divorce-cost"),
  pair("florida", "divorce-cost"),
  pair("new-york", "personal-injury-cost"),
  pair("alabama", "personal-injury-cost"),
  ...CATEGORIES.map((c) => pair("texas", `${c.slug}-cost`)),
  // State/matter pairs whose figures tie with a neighbour or sit one place from another measure;
  // they produced "$0 over the midpoint", "1 places" and "22th percentile" before.
  pair("arizona", "divorce-cost"),
  pair("arkansas", "divorce-cost"),
  pair("montana", "divorce-cost"),
  pair("indiana", "divorce-cost"),
  pair("tennessee", "dui-cost"),
  pair("texas", "dui-cost"),
  pair("alaska", "personal-injury-cost"),
  pair("delaware", "personal-injury-cost"),
  pair("wyoming", "personal-injury-cost"),
  pair("minnesota", "bankruptcy-cost"),
  pair("north-carolina", "bankruptcy-cost"),
  pair("oklahoma", "dui-cost"),
  pair("idaho", "bankruptcy-cost"),
  pair("massachusetts", "bankruptcy-cost"),
  pair("alabama", "real-estate-cost"),
  pair("arizona", "estate-planning-cost"),
  pair("virginia", "estate-planning-cost"),
  pair("alabama", "divorce-cost"),
  pair("hawaii", "divorce-cost"),
  pair("kansas", "divorce-cost"),
  pair("nevada", "dui-cost"),
];

const OTHER_PAGES: Array<[string, () => Promise<string>]> = [
  ["/", () => renderPage(HomePage)],
  ["/how-legal-fees-work", () => renderPage(GuidePage)],
  ["/embed", () => renderPage(EmbedPage)],
  ["/legal-cost-statistics", () => renderPage(StatisticsPage)],
];

const ALL_PAGES = [...TEMPLATE_PAGES, ...OTHER_PAGES];

describe("K2: readers never see developer vocabulary or broken generated prose", () => {
  it.each(ALL_PAGES)("%s has no developer vocabulary", async (_path, render) => {
    expect(matches(visibleText(await render()), DEVELOPER_SPEAK)).toEqual([]);
  });

  it.each(ALL_PAGES)("%s has no broken grammar, self-comparison or empty figures", async (_path, render) => {
    expect(matches(visibleText(await render()), BROKEN_PROSE)).toEqual([]);
  });

  it.each([OTHER_PAGES[0], ...TEMPLATE_PAGES.slice(0, 6)])("%s does not call its own figures a dataset", async (_path, render) => {
    expect(matches(visibleText(await render()), DATASET_WORD)).toEqual([]);
  });

  it("the scan itself detects each pattern (positive control)", () => {
    for (const bad of [
      "NEXT_PUBLIC_GA_ID",
      "process.env.X",
      "costs.json",
      "not streamed",
      "bundled dataset",
      "the seed",
      "Texas carries 3 rows",
      "this is what passes SEO value",
      "January is the busiest month",
    ]) {
      expect(matches(bad, DEVELOPER_SPEAK).length, bad).toBeGreaterThan(0);
    }
    for (const bad of [
      "with 1 states recording",
      "Californiacourt's own schedule",
      "$0 clear of Alabama",
      "$0 over the $2,900 tier midpoint",
      "a $0 window",
      "sit 1 places apart",
      "the 22th percentile",
      "How Much Does a Immigration Cost",
      "a estate planning",
      "−$0",
      "adding $0 to the $4,400 estimate",
      "passing under Kentucky: $0.",
      "0 more hours at $220 is $0, but",
      "1 more hours at $220",
      "with 0 states recording less",
      "0 places below its 40th on cost",
      "implies — 0 hours apart.",
    ]) {
      expect(matches(bad, BROKEN_PROSE).length, bad).toBeGreaterThan(0);
    }
    for (const fine of ["1 state sits", "the 11th percentile", "the 21st percentile", "an immigration", "7.1 matters", "a one-time cost", "1 more hour at $220"]) {
      expect(matches(fine, BROKEN_PROSE), fine).toEqual([]);
    }
  });
});

describe("K2/K4: article agreement and no unsourced seasonal or embed-source text", () => {
  it.each([
    ["immigration", "Immigration", "an"],
    ["estate-planning", "Estate Planning", "an"],
    ["divorce", "Divorce", "a"],
  ])("%s headline uses the right article", async (slug, displayName, article) => {
    const html = visibleText(await renderPage(StateCategoryPage, { state: "texas", slug: `${slug}-cost` }));
    expect(html).toContain(`How Much Does ${article} ${displayName}`);
  });

  it.each([pair("california", "divorce-cost"), pair("new-york", "personal-injury-cost")])(
    "%s carries no raw embed snippet and points to /embed instead",
    async (_path, render) => {
      const html = await render();
      expect(html).not.toContain("legalcostcalc-embed");
      expect(html).not.toMatch(/<iframe/i);
      expect(visibleText(html)).not.toMatch(/&lt;iframe|<iframe|<script/i);
      expect(html).toContain('href="/embed"');
    },
  );

  it("home and the divorce page carry no unsourced seasonal banner", async () => {
    for (const render of [OTHER_PAGES[0][1], TEMPLATE_PAGES[0][1]]) {
      expect(visibleText(await render())).not.toMatch(/busiest month|divorce-related searches/i);
    }
  });
});
