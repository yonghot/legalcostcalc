import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import EmbedIndexPage from "@/app/embed/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";

const ROOT = join(__dirname, "..", "..");

const FORBIDDEN: Record<string, RegExp> = {
  "to be specified": /to be specified by (counsel|the operator)/i,
  "to be determined": /TO BE DETERMINED/i,
  "note to operator": /note to operator/i,
  "reviewer pending": /(legal |clinical )?reviewer pending/i,
  "future release": /planned for a future release/i,
  "not yet engaged": /has not yet been engaged/i,
  "we plan to add": /we plan to add/i,
  "placeholder pending": /placeholders? (pending|rules|values)/i,
  "pending verification": /pending verification/i,
  "coming soon": /coming soon/i,
  "lorem ipsum": /lorem ipsum/i,
  "bracket token": /\[(STATE|VENUE|PROVINCE)\b[^\]]*\]/,
  DRAFT: /\bDRAFT\b/,
};

function sourceFiles(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path, pattern);
    return pattern.test(name) ? [path] : [];
  });
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

function findings(text: string): string[] {
  return Object.entries(FORBIDDEN)
    .filter(([, re]) => re.test(text))
    .map(([name]) => name);
}

describe("K1: no visible draft or placeholder copy in rendered sources", () => {
  const files = [
    ...["app", "components", "lib"].flatMap((d) => sourceFiles(join(ROOT, "src", d), /\.(tsx|ts)$/)),
    ...sourceFiles(join(ROOT, "src", "data"), /\.json$/),
  ];

  it("scans a non-trivial set of sources", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  it("no source file contains draft or placeholder copy outside comments", () => {
    const hits = files
      .map((f) => ({ f, found: findings(stripComments(readFileSync(f, "utf8"))) }))
      .filter((x) => x.found.length > 0)
      .map((x) => `${x.f.slice(ROOT.length + 1)}: ${x.found.join(", ")}`);
    expect(hits).toEqual([]);
  });
});

describe("K1: rendered pages carry no draft or placeholder copy", () => {
  const pages: Array<[string, () => Promise<string>]> = [
    ["/", () => renderPage(HomePage)],
    ["/about", () => renderPage(AboutPage)],
    ["/contact", () => renderPage(ContactPage)],
    ["/privacy", () => renderPage(PrivacyPage)],
    ["/terms", () => renderPage(TermsPage)],
    ["/embed", () => renderPage(EmbedIndexPage)],
    ["/how-legal-fees-work", () => renderPage(GuidePage)],
    [
      "/california/divorce-cost",
      () => renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" }),
    ],
    [
      "/florida/divorce-cost",
      () => renderPage(StateCategoryPage, { state: "florida", slug: "divorce-cost" }),
    ],
    [
      "/new-york/personal-injury-cost",
      () => renderPage(StateCategoryPage, { state: "new-york", slug: "personal-injury-cost" }),
    ],
  ];

  it.each(pages)("%s", async (_path, render) => {
    const html = await render();
    expect(html.length).toBeGreaterThan(1000);
    expect(findings(html)).toEqual([]);
  });

  it("/terms keeps no governing-law or arbitration clause that depends on an unnamed jurisdiction", async () => {
    const html = await renderPage(TermsPage);
    const present = [/arbitration/i, /Governing Law/i, /Section 4B/, /Section 9\b/]
      .filter((re) => re.test(html))
      .map(String);
    expect(present).toEqual([]);
  });

  it("/terms headings are numbered 1..N with no gaps or lettered sections", async () => {
    const html = await renderPage(TermsPage);
    const headings = [...html.matchAll(/<h2[^>]*>([^<]*)<\/h2>/g)].map((m) => m[1]);
    const numbers = headings.map((h) => Number(/^(\d+)\. /.exec(h)?.[1] ?? Number.NaN));
    expect(headings.length).toBeGreaterThanOrEqual(9);
    expect(numbers).toEqual(headings.map((_, i) => i + 1));
  });
});
