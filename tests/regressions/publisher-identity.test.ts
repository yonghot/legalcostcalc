import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import DivorceHubPage from "@/app/divorce-cost-by-state/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";

const BYLINE_PAGES: Array<[string, () => Promise<string>]> = [
  ["/how-legal-fees-work", () => renderPage(GuidePage)],
  ["/legal-cost-statistics", () => renderPage(StatisticsPage)],
  ["/divorce-cost-by-state", () => renderPage(DivorceHubPage)],
  ["/california/divorce-cost", () => renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" })],
  ["/florida/divorce-cost", () => renderPage(StateCategoryPage, { state: "florida", slug: "divorce-cost" })],
  [
    "/new-york/personal-injury-cost",
    () => renderPage(StateCategoryPage, { state: "new-york", slug: "personal-injury-cost" }),
  ],
];

const ALL_PAGES: Array<[string, () => Promise<string>]> = [["/", () => renderPage(HomePage)], ...BYLINE_PAGES];

function visibleText(html: string): string {
  return html.replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g, "");
}

describe("K30: rendered pages never claim a review without a recorded reviewer", () => {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.NEXT_PUBLIC_REVIEWER_NAME;
    delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
    else process.env.NEXT_PUBLIC_REVIEWER_NAME = original;
  });

  it.each(ALL_PAGES)("%s makes no review or editorial-team claim", async (_path, render) => {
    const text = visibleText(await render());
    expect(text).not.toMatch(/reviewer pending/i);
    expect(text).not.toMatch(/Editorial Team/i);
    expect(text).not.toMatch(/\bReviewed (for|by)\b/);
  });

  it.each(BYLINE_PAGES)("%s names the publisher and states the page is not attorney-reviewed", async (_path, render) => {
    const text = visibleText(await render());
    expect(text).toMatch(/Published by/);
    expect(text).toContain("Actigence");
    expect(text).toContain("Not reviewed by a licensed attorney");
  });
});
