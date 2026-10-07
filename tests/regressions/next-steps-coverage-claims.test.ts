import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { nextStepsFor, type NextStep } from "@/lib/next-steps";
import { homeNextSteps, pageNextSteps } from "@/lib/next-steps-server";

const COVERAGE_CLAIM = /\bevery state\b|\ball (?:50|51) states\b|\ball states\b|\bevery state's\b|\bin every state\b/i;

const stepText = (steps: NextStep[]) => steps.map((s) => `${s.title} ${s.hint}`).join(" | ");
const decode = (s: string) => s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&amp;/g, "&");

function hubRows(html: string): number {
  const body = html.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";
  return (body.match(/<tr\b/g) ?? []).length;
}

describe("UX P0-3 / K4: the Next steps block never claims a coverage the category table does not have", () => {
  it("the coverage-claim matcher catches the wording the block used to carry", () => {
    expect(COVERAGE_CLAIM.test("See personal injury cost in every state")).toBe(true);
    expect(COVERAGE_CLAIM.test("Every state's estimate in one table.")).toBe(true);
    expect(COVERAGE_CLAIM.test("Compare personal injury cost across states")).toBe(false);
  });

  it("some category tables list fewer states than exist, which is why the claim would be false", async () => {
    const rowsByCategory = await Promise.all(
      CATEGORIES.map(async (c) => hubRows(await renderPage(CategoryHubPage, { category: c.slug }))),
    );
    expect(rowsByCategory.some((rows) => rows < STATES.length)).toBe(true);
    expect(rowsByCategory.every((rows) => rows > 0)).toBe(true);
  });

  for (const category of CATEGORIES) {
    it(`${category.slug}: the rendered block on a matter page makes no all-states claim`, async () => {
      const page = INDEXABLE_PAGES.find((p) => p.category.slug === category.slug);
      expect(page, `an indexable ${category.slug} page`).toBeDefined();
      const html = await renderPage(StateCategoryPage, { state: page!.state.slug, slug: `${category.slug}-cost` });
      const block = html.match(/<section[^>]*data-next-step="answer"[\s\S]*?<\/section>/)?.[0] ?? "";
      expect(block).not.toBe("");
      expect(decode(block.replace(/<[^>]+>/g, " "))).not.toMatch(COVERAGE_CLAIM);
      const hub = hubRows(await renderPage(CategoryHubPage, { category: category.slug }));
      expect(block).toContain(`href="/category/${category.slug}"`);
      expect(hub).toBeGreaterThan(0);
    });

    it(`${category.slug}: the server and client step builders make no all-states claim`, () => {
      const server = pageNextSteps({
        stateSlug: "massachusetts",
        stateName: "Massachusetts",
        categorySlug: category.slug,
        categoryName: category.displayName,
        moderateMedian: 4400,
        moderateLow: 2000,
        moderateHigh: 9000,
      });
      const client = nextStepsFor(category.slug, category.displayName);
      expect(stepText(server)).not.toMatch(COVERAGE_CLAIM);
      expect(stepText(client)).not.toMatch(COVERAGE_CLAIM);
      expect(server.some((s) => s.href === `/category/${category.slug}`)).toBe(true);
      expect(client.some((s) => s.href === `/category/${category.slug}`)).toBe(true);
    });
  }

  it("the home block makes no all-states claim either", () => {
    expect(stepText(homeNextSteps())).not.toMatch(COVERAGE_CLAIM);
  });
});
