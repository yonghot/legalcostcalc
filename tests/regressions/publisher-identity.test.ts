import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
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

const ALL_PAGES: Array<[string, () => Promise<string>]> = [
  ["/", () => renderPage(HomePage)],
  ["/about", () => renderPage(AboutPage)],
  ...BYLINE_PAGES,
];

const LD_JSON = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;

function visibleText(html: string): string {
  return html.replace(LD_JSON, "");
}

function ldNodes(html: string): unknown[] {
  return [...html.matchAll(LD_JSON)].map((m) => JSON.parse(m[1]));
}

function refs(value: unknown, out: Array<[string, unknown]> = []): Array<[string, unknown]> {
  if (Array.isArray(value)) value.forEach((v) => refs(v, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (k === "publisher" || k === "author" || k === "creator") out.push([k, v]);
      refs(v, out);
    }
  }
  return out;
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

  it.each(ALL_PAGES)("%s: JSON-LD publisher, author and creator are the Actigence Organization", async (_path, render) => {
    const nodes = ldNodes(await render());
    expect(nodes.length).toBeGreaterThan(0);
    for (const [key, value] of nodes.flatMap((n) => refs(n))) {
      expect(value, key).toMatchObject({ "@type": "Organization", name: "Actigence", url: "https://actigence.ai" });
    }
  });

  it.each(ALL_PAGES)("%s: JSON-LD has no Person node, reviewer, review date, founding date or editorial team", async (_path, render) => {
    const json = JSON.stringify(ldNodes(await render()));
    expect(json).not.toMatch(/reviewedBy|lastReviewed|foundingDate|Editorial Team|"@type":"Person"/);
  });
});
