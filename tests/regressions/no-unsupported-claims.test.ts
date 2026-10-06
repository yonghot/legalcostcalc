import { readFileSync, readdirSync, statSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import ComparePage from "@/app/compare/page";
import CategoryHubPage from "@/app/category/[category]/page";
import StateHubPage from "@/app/[state]/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { metadata } from "@/app/layout";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/\s+/g, " ");

const UNSUPPORTED: Array<[string, RegExp]> = [
  ["recorded", /\brecorded\b/i],
  ["real data", /\breal (?:state-level )?data\b|\breal state-level\b/i],
  ["verified, non-duplicate", /verified,? non-duplicate/i],
  ["quarterly", /\bquarterly\b/i],
  ["source-verified", /source-verified/i],
  ["streamed", /\bstreamed\b/i],
  ["reported quotes", /reported quotes/i],
  ["verification date", /verification date/i],
  ["last verification", /last verification/i],
];

function expectClean(label: string, content: string) {
  for (const [name, pattern] of UNSUPPORTED) {
    expect(content, `${label}: ${name}`).not.toMatch(pattern);
  }
}

const METHOD_NOTE = /modeled from published national fee guides and rate surveys/i;
const NOT_QUOTES = /not quotes from (?:law )?firms/i;

describe("K3/K4: pages describe the figures as modeled estimates, never as recorded or verified data", () => {
  const SINGLE_PAGES: Array<[string, () => Promise<string>]> = [
    ["/", () => renderPage(HomePage)],
    ["/about", () => renderPage(AboutPage)],
    ["/legal-cost-statistics", () => renderPage(StatisticsPage)],
    ["/how-legal-fees-work", () => renderPage(GuidePage)],
    ["/compare", async () => renderToStaticMarkup(createElement(ComparePage))],
    ["/category/divorce", () => renderPage(CategoryHubPage, { category: "divorce" })],
    ["/california", () => renderPage(StateHubPage, { state: "california" })],
  ];

  it.each(SINGLE_PAGES)("%s", async (path, render) => {
    expectClean(path, text(await render()));
  });

  it("the layout metadata (description, Open Graph, Twitter) makes no unsupported claim", () => {
    const blob = JSON.stringify({
      description: metadata.description,
      og: metadata.openGraph,
      twitter: metadata.twitter,
    });
    expectClean("layout metadata", blob);
    expect(String(metadata.description)).not.toMatch(/based on real data/i);
  });

  it("image-card text in opengraph-image routes makes no unsupported claim", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) walk(full);
        else if (/^opengraph-image\.tsx$/.test(entry)) files.push(full);
      }
    };
    walk(join(process.cwd(), "src", "app"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/source-verified/i);
      expect(source, file).not.toMatch(/\breal data\b/i);
    }
  });

  it.each(STATES.map((s) => [s.name, s.slug] as const))("%s: every category page", async (_name, stateSlug) => {
    for (const category of CATEGORIES) {
      const slug = `${category.slug}-cost`;
      const html = text(await renderPage(StateCategoryPage, { state: stateSlug, slug } as never));
      expectClean(`/${stateSlug}/${slug}`, html);
    }
  }, 60_000);
});

describe("K3/K4: a short plain-language method note replaces the claims", () => {
  it("the About page says the figures are modeled estimates shown as ranges, not firm quotes", async () => {
    const html = text(await renderPage(AboutPage));
    expect(html).toMatch(METHOD_NOTE);
    expect(html).toMatch(NOT_QUOTES);
  });

  it("every category hub carries the same note", async () => {
    for (const category of CATEGORIES) {
      const html = text(await renderPage(CategoryHubPage, { category: category.slug }));
      expect(html, category.slug).toMatch(METHOD_NOTE);
    }
  });

  it("a state category page carries the note and promises no refresh schedule", async () => {
    const html = text(await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never));
    expect(html).toMatch(METHOD_NOTE);
    expect(html).toMatch(NOT_QUOTES);
    expect(html).not.toMatch(/refreshed|reviewed and updated|we (?:review|update)/i);
  });

  it("the home page and About page promise no update cadence", async () => {
    for (const render of [() => renderPage(HomePage), () => renderPage(AboutPage)]) {
      const html = text(await render());
      expect(html).not.toMatch(/regularly updated|data refreshed|we review and update/i);
    }
  });
});
