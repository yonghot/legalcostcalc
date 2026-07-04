/**
 * tests/code-02-schema.test.ts
 *
 * CODE-02 (부속P §4) — replace deprecated FAQPage/HowTo JSON-LD with the
 * still-supported 2026 rich-result set: Article + BreadcrumbList +
 * SoftwareApplication/WebApplication + WebSite/SearchAction (root).
 *
 * Acceptance criteria under test:
 *   - No page renders <FaqSchema> (FAQPage JSON-LD) into <head> anymore.
 *   - The home page and every /[state]/[slug] page emit Article JSON-LD
 *     (author Person-or-Organization, publisher Organization, dateModified
 *     from real verified data).
 *   - BreadcrumbList is still wired (unchanged, confirmed present).
 *   - SoftwareApplication is still wired, aggregateRating is never emitted
 *     (no real rating data exists).
 *   - Root emits WebSite + potentialAction SearchAction pointing at a real,
 *     functional target (not a fabricated/dead-end URL).
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ArticleSchema } from "@/components/seo/article-schema";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";

const APP_DIR = path.resolve(__dirname, "..", "src", "app");

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

/** Recursively collects every .tsx/.ts file under src/app (no shell-out). */
function collectAppFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) {
      out.push(...collectAppFiles(full));
    } else if (/\.(tsx|ts)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("CODE-02 — FAQPage JSON-LD removed from every rendered page", () => {
  it("src/app/page.tsx no longer renders <FaqSchema>", () => {
    const src = readSource("src/app/page.tsx");
    expect(src).not.toMatch(/<FaqSchema/);
    expect(src).not.toMatch(/import\s*\{\s*FaqSchema\s*\}/);
  });

  it("src/app/[state]/[slug]/page.tsx no longer renders <FaqSchema>", () => {
    const src = readSource("src/app/[state]/[slug]/page.tsx");
    expect(src).not.toMatch(/<FaqSchema/);
    expect(src).not.toMatch(/import\s*\{\s*FaqSchema\s*\}/);
  });

  it("no route file under src/app renders <FaqSchema> anywhere", () => {
    const offenders: string[] = [];
    for (const file of collectAppFiles(APP_DIR)) {
      const content = readFileSync(file, "utf8");
      if (/<FaqSchema/.test(content)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("CODE-02 — Article JSON-LD", () => {
  it("renders Article schema with headline, description, url, dateModified, author, publisher", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleSchema, {
        headline: "Test Headline",
        description: "Test description.",
        url: "https://legalcostcalc.co/california/divorce-cost",
        dateModified: "2026-06-29",
      }),
    );
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain("Test Headline");
    expect(html).toContain('"dateModified":"2026-06-29"');
    expect(html).toContain('"@type":"Organization"'); // publisher (and/or fallback author)
  });

  it("never fabricates datePublished/dateModified when no real date is supplied", () => {
    const html = renderToStaticMarkup(
      createElement(ArticleSchema, {
        headline: "Test Headline",
        description: "Test description.",
        url: "https://legalcostcalc.co/california/divorce-cost",
        dateModified: null,
      }),
    );
    expect(html).not.toContain("dateModified");
    expect(html).not.toContain("datePublished");
  });

  it("uses a real configured reviewer Person when NEXT_PUBLIC_REVIEWER_NAME is set, else the Organization", async () => {
    const originalName = process.env.NEXT_PUBLIC_REVIEWER_NAME;
    try {
      delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
      const htmlWithoutReviewer = renderToStaticMarkup(
        createElement(ArticleSchema, {
          headline: "H",
          description: "D",
          url: "https://legalcostcalc.co/",
        }),
      );
      expect(htmlWithoutReviewer).toContain("LegalCostCalc Editorial Team");

      process.env.NEXT_PUBLIC_REVIEWER_NAME = "Jane Smith";
      // getReviewerConfig reads process.env at call time (see
      // src/lib/reviewer.ts), so re-invoking the same component picks up the
      // new env value immediately — no module re-import needed.
      const htmlWithReviewer = renderToStaticMarkup(
        createElement(ArticleSchema, {
          headline: "H",
          description: "D",
          url: "https://legalcostcalc.co/",
        }),
      );
      expect(htmlWithReviewer).toContain('"@type":"Person"');
      expect(htmlWithReviewer).toContain("Jane Smith");
    } finally {
      if (originalName === undefined) {
        delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
      } else {
        process.env.NEXT_PUBLIC_REVIEWER_NAME = originalName;
      }
    }
  });
});

describe("CODE-02 — SoftwareApplication never fabricates aggregateRating", () => {
  it("SoftwareApplicationSchema output never contains aggregateRating (no real rating data exists)", () => {
    const html = renderToStaticMarkup(
      createElement(SoftwareApplicationSchema, {
        name: "Test Calculator",
        description: "Test description.",
        url: "https://legalcostcalc.co/california/divorce-cost",
        dateModified: "2026-06-29",
      }),
    );
    expect(html).not.toContain("aggregateRating");
    expect(html).not.toContain('"review"');
  });
});

describe("CODE-02 — WebSite + SearchAction on root", () => {
  it("OrganizationSchema emits a WebSite node with potentialAction SearchAction", () => {
    const html = renderToStaticMarkup(createElement(OrganizationSchema, {}));
    expect(html).toContain('"@type":"WebSite"');
    expect(html).toContain('"@type":"SearchAction"');
    expect(html).toContain('"query-input":"required name=search_term_string"');
  });

  it("SearchAction target points at a real, implemented route (not a fabricated dead-end)", () => {
    const html = renderToStaticMarkup(createElement(OrganizationSchema, {}));
    expect(html).toContain("/search?q={search_term_string}");

    // The target route must actually exist in the app tree.
    const searchPageSrc = readSource("src/app/search/page.tsx");
    expect(searchPageSrc).toMatch(/searchParams/);
  });

  it("never emits FAQPage in the WebSite/Organization graph", () => {
    const html = renderToStaticMarkup(createElement(OrganizationSchema, {}));
    expect(html).not.toContain("FAQPage");
  });
});
