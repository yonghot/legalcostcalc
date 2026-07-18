/**
 * tests/guide-how-legal-fees-work.test.ts
 *
 * U-02 (부속U §4/§5) — /how-legal-fees-work original editorial guide.
 * INFORMATIONAL ONLY: explains attorney fee structures and the
 * professional-conduct rules that govern them; makes no advice-giving claim
 * about any specific case. Modeled on LaunchCostCalc's /how-to-start-an-llc
 * guide (commit 2746a0a).
 *
 * Acceptance criteria under test (부속U §4 U-02 + this wave's task spec):
 *   - >=10 H2 sections rendered in the static (JS-off) HTML.
 *   - >=8 distinct official source links rendered inline.
 *   - The disclaimer renders top AND bottom.
 *   - The page is present in sitemap.xml.
 *   - A main-nav link to the guide exists (Header).
 *   - No FAQPage/HowTo JSON-LD anywhere on the page (Article + BreadcrumbList
 *     only, per CODE-02's still-supported 2026 rich-result set).
 *   - AuthorByline/dateModified (E-E-A-T) render from a real, non-fabricated
 *     date — never `new Date()`.
 *   - >=4 real, distinct differentiating facts in the "at a glance" block
 *     (the info-gain gate's spirit, applied to a static content page that
 *     has no INDEXABLE_PAGES-style dynamic gate to register against).
 *   - No UPL advice-verb language anywhere on the page.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

vi.mock("next/navigation", () => ({
  usePathname: () => "/how-legal-fees-work",
  notFound: () => {
    throw new Error("notFound() must not be reached in this test");
  },
}));

vi.mock("next/link", async () => {
  const { createElement: h } = await import("react");
  return {
    default: ({
      href,
      children,
      className,
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
    }) => h("a", { href, className }, children),
  };
});

import HowLegalFeesWorkPage, { metadata } from "@/app/how-legal-fees-work/page";
import {
  GUIDE_UPDATED,
  GUIDE_FACTS,
  GUIDE_SECTIONS,
  GUIDE_SOURCES,
} from "@/app/how-legal-fees-work/content";
import sitemap from "@/app/sitemap";

const APP_DIR = path.resolve(__dirname, "..", "src", "app");

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

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

const ADVICE_VERB_PATTERNS = [
  /you should/i,
  /we recommend/i,
  /you need to/i,
  /you must file/i,
  /best (attorney|lawyer|choice)/i,
  /guaranteed/i,
  /will win/i,
];

describe("/how-legal-fees-work — content shape (no-fabrication, real sources)", () => {
  it("GUIDE_SECTIONS has 10-13 substantive sections (부속U §4 U-02 사양)", () => {
    expect(GUIDE_SECTIONS.length).toBeGreaterThanOrEqual(10);
    expect(GUIDE_SECTIONS.length).toBeLessThanOrEqual(13);
  });

  it("every section has real, substantive prose (>=3 sentences)", () => {
    for (const section of GUIDE_SECTIONS) {
      expect(section.heading.length).toBeGreaterThan(10);
      const sentenceCount = section.prose
        .split(/(?<=[.!?])\s+/)
        .filter((s) => s.trim().length > 0).length;
      expect(sentenceCount).toBeGreaterThanOrEqual(3);
      expect(section.prose.length).toBeGreaterThan(300);
    }
  });

  it("has >=4 distinct, sourced differentiating facts (info-gain gate spirit)", () => {
    expect(GUIDE_FACTS.length).toBeGreaterThanOrEqual(4);
    const urls = new Set(GUIDE_FACTS.map((f) => f.sourceUrl));
    expect(urls.size).toBeGreaterThanOrEqual(4);
    for (const fact of GUIDE_FACTS) {
      expect(fact.sourceUrl).toMatch(/^https:\/\//);
      expect(fact.fact.length).toBeGreaterThan(10);
      expect(fact.detail.length).toBeGreaterThan(20);
    }
  });

  it(">=8 distinct official/authoritative source citations, all real https URLs", () => {
    expect(GUIDE_SOURCES.length).toBeGreaterThanOrEqual(8);
    const urls = new Set(GUIDE_SOURCES.map((s) => s.url));
    expect(urls.size).toBe(GUIDE_SOURCES.length); // no duplicates
    for (const src of GUIDE_SOURCES) {
      expect(src.url).toMatch(/^https:\/\//);
      expect(src.name.length).toBeGreaterThan(5);
    }
    // At least the core official rule-making/government sources cited in
    // the per-repo spec (ABA Model Rule 1.5, state statutes/state bar).
    const domains = GUIDE_SOURCES.map((s) => new URL(s.url).hostname);
    expect(domains.some((d) => d.includes("americanbar.org"))).toBe(true);
    expect(domains.some((d) => d.includes("leginfo.legislature.ca.gov"))).toBe(true);
    expect(domains.some((d) => d.includes("calbar.ca.gov"))).toBe(true);
    expect(domains.some((d) => d.includes("clio.com"))).toBe(true);
  });

  it("GUIDE_UPDATED is a real, fixed date (not new Date())", () => {
    expect(GUIDE_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("/how-legal-fees-work — rendered page (curl JS-off simulation)", () => {
  const html = renderToStaticMarkup(createElement(HowLegalFeesWorkPage));

  it("renders >=10 <h2> sections", () => {
    const h2Count = (html.match(/<h2[ >]/g) || []).length;
    expect(h2Count).toBeGreaterThanOrEqual(10);
  });

  it("renders >=8 distinct official source links inline", () => {
    // React HTML-escapes "&" to "&amp;" in attribute values (e.g. the
    // leginfo.legislature.ca.gov URLs carry a real query-string "&") — match
    // against the escaped form, same as any real HTML parser would see it.
    for (const src of GUIDE_SOURCES) {
      const escapedHref = `href="${src.url.replace(/&/g, "&amp;")}"`;
      expect(html).toContain(escapedHref);
    }
    const hrefs = new Set(
      Array.from(html.matchAll(/href="(https:\/\/[^"]+)"/g)).map((m) =>
        m[1].replace(/&amp;/g, "&"),
      ),
    );
    expect(hrefs.size).toBeGreaterThanOrEqual(8);
  });

  it("renders the disclaimer top AND bottom", () => {
    const disclaimerCount = (html.match(/Not legal advice|NOT legal advice/gi) || []).length;
    expect(disclaimerCount).toBeGreaterThanOrEqual(2);
  });

  it("renders AuthorByline and UpdatedBadge from the real GUIDE_UPDATED date (E-E-A-T, no fabricated credentials)", () => {
    expect(html).toContain("LegalCostCalc Editorial Team");
    expect(html).toContain("Updated for 2026");
    expect(html).not.toMatch(/J\.?D\.?,?\s*Esq\.?/); // no invented attorney credential
  });

  it("renders Article JSON-LD with a real dateModified, never FAQPage/HowTo", () => {
    expect(html).toContain('"@type":"Article"');
    expect(html).toContain(`"dateModified":"${GUIDE_UPDATED}"`);
    expect(html).not.toContain("FAQPage");
    expect(html).not.toContain('"@type":"HowTo"');
  });

  it("contains no UPL advice-verb language", () => {
    for (const pattern of ADVICE_VERB_PATTERNS) {
      expect(html).not.toMatch(pattern);
    }
  });

  it("links to the calculator and at least one real spoke page (internal linking)", () => {
    expect(html).toMatch(/href="\/"/);
    expect(html).toContain('href="/california/divorce-cost"');
  });
});

describe("/how-legal-fees-work — metadata (tool/topic-intent title)", () => {
  it("buildMeta title mentions the guide topic and is not empty", () => {
    const title = String(metadata.title ?? "");
    expect(title.length).toBeGreaterThan(10);
    expect(title).toMatch(/Legal Fees/i);
  });

  it("canonical path is set to /how-legal-fees-work", () => {
    expect(metadata.alternates?.canonical).toBe("/how-legal-fees-work");
  });
});

describe("/how-legal-fees-work — no FAQPage/HowTo anywhere in the route tree", () => {
  it("the page source never imports or renders <FaqSchema> or a HowTo schema component", () => {
    const src = readSource("src/app/how-legal-fees-work/page.tsx");
    expect(src).not.toMatch(/<FaqSchema/);
    expect(src).not.toMatch(/import\s*\{\s*FaqSchema\s*\}/);
    expect(src).not.toMatch(/<HowToSchema/);
    expect(src).not.toMatch(/"@type":\s*"HowTo"/);
  });

  it("no route file under src/app renders <FaqSchema> anywhere (sitewide guardrail, re-verified)", () => {
    const offenders: string[] = [];
    for (const file of collectAppFiles(APP_DIR)) {
      const content = readFileSync(file, "utf8");
      if (/<FaqSchema/.test(content)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });
});

describe("/how-legal-fees-work — sitemap + nav registration", () => {
  it("is present in sitemap.xml", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/how-legal-fees-work"))).toBe(true);
  });

  it("has a main-nav (Header) link", () => {
    const headerSrc = readSource("src/components/layout/header.tsx");
    expect(headerSrc).toMatch(/href:\s*"\/how-legal-fees-work"/);
  });

  it("has a footer link (secondary discoverability)", () => {
    const footerSrc = readSource("src/components/layout/footer.tsx");
    expect(footerSrc).toMatch(/href="\/how-legal-fees-work"/);
  });
});
