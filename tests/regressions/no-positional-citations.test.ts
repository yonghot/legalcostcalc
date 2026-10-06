import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { getCostForPage } from "@/lib/services/cost-service";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { AnswerBlock } from "@/components/seo/answer-block";
import { CostResult } from "@/components/calculator/cost-result";
import { costFamilyKey, getFamilyDate } from "@/lib/content-dates";

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const BARE_DOMAIN_PAREN = /\((?:[a-z0-9-]+\.)+(?:gov|com|org|net)\)/i;
const FIGURE_THEN_DOMAIN = /\$[\d,]+[^$]{0,160}?\((?:www\.)?(?:uscourts|uscis|ibuyer|clio|nolo|bls|thumbtack|findlaw|legalzoom)\.(?:gov|com|org)\)/i;

const SAMPLE: Array<[string, string, string]> = [
  ["alabama", "bankruptcy", "uscourts.gov"],
  ["wyoming", "immigration", "uscis.gov"],
  ["hawaii", "real-estate", "ibuyer.com"],
  ["wyoming", "criminal-defense", "thumbtack.com"],
];

const blockFor = async (stateSlug: string, categorySlug: string) => {
  const state = STATE_BY_SLUG.get(stateSlug)!;
  const category = CATEGORY_MAP.get(categorySlug)!;
  const costs = await getCostForPage(categorySlug, state.code);
  return {
    costs,
    block: buildAnswerBlock({
      category,
      state,
      costs,
      dateRecord: getFamilyDate(costFamilyKey(categorySlug)) ?? null,
    }),
  };
};

describe("K4: no inline source attribution decided by array position", () => {
  it.each(SAMPLE)("%s %s page has no domain in parentheses after a figure", async (state, category) => {
    const page = text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` } as never));
    expect(page).not.toMatch(FIGURE_THEN_DOMAIN);
    expect(page).not.toMatch(BARE_DOMAIN_PAREN);
  });

  it.each(SAMPLE)("%s %s page lists its sources once as general references", async (state, category, domain) => {
    const page = text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` } as never));
    expect(page).toContain("Sources consulted");
    expect(page).toContain(domain);
  });

  it("answer block statistics carry no per-figure source, and the sources trace to the seed rows", async () => {
    for (const [state, category] of SAMPLE) {
      const { costs, block } = await blockFor(state, category);
      expect(block.stats.length, `${state}/${category}`).toBeGreaterThanOrEqual(2);
      for (const stat of block.stats) {
        expect(Object.keys(stat)).toEqual(["text"]);
      }
      expect(block.sources.length).toBeGreaterThan(0);
      const seedUrls = new Set(costs.flatMap((c) => c.sources));
      for (const source of block.sources) {
        expect(seedUrls.has(source.url)).toBe(true);
        expect(source.label).not.toContain("/");
      }
      expect(new Set(block.sources.map((s) => s.url)).size).toBe(block.sources.length);
    }
  });

  it("the component renders one references line, not a link after each statistic", async () => {
    const { block } = await blockFor("alabama", "bankruptcy");
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    const visible = text(html);
    expect(visible).toMatch(/Sources consulted/);
    expect(visible).toMatch(/not matched to individual figures/);
    expect(visible).not.toMatch(BARE_DOMAIN_PAREN);
    for (const source of block.sources) {
      expect(html).toContain(`href="${source.url}"`);
    }
    expect((html.match(/Sources consulted/g) ?? []).length).toBe(1);
  });

  it("the calculator result card does not call the first listed source the primary source", async () => {
    for (const category of ["divorce", "bankruptcy", "immigration"]) {
      const costs = await getCostForPage(category, "AL");
      const html = text(
        renderToStaticMarkup(
          createElement(CostResult, {
            results: [costs.find((c) => c.complexity === "moderate")!],
            stateName: "Alabama",
            categoryName: category,
            categorySlug: category,
            stateCode: "AL",
            stateSlug: "alabama",
            monetizationDisabled: true,
          }),
        ),
      );
      expect(html, category).not.toMatch(/Primary source/i);
      expect(html, category).toContain("Data Sources");
      expect(html, category).toContain("Source 1");
    }
  });

  it("holds for every state and category", async () => {
    for (const state of STATES) {
      for (const category of CATEGORIES) {
        const { block } = await blockFor(state.slug, category.slug);
        for (const stat of block.stats) {
          expect(Object.keys(stat), `${state.slug}/${category.slug}`).toEqual(["text"]);
        }
      }
    }
  });
});
