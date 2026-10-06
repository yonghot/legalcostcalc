import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import AboutPage from "@/app/about/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { TermsGateCheckbox } from "@/components/compliance/TermsGate";

const ROOT = join(__dirname, "..", "..");

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

const sentences = (s: string) => s.split(/(?<=[.!?])\s+/);

const POLICY_PAGES: Array<[string, () => Promise<string>]> = [
  ["/terms", () => renderPage(TermsPage)],
  ["/privacy", () => renderPage(PrivacyPage)],
  ["/about", () => renderPage(AboutPage)],
];

const ACTIVE_CLAIMS: Array<[string, RegExp]> = [
  ["affiliate partner", /affiliate partner/i],
  ["Clio affiliate", /clio[^.]{0,60}affiliate|affiliate[^.]{0,60}clio/i],
  ["links are affiliate links", /\blinks?\b[^.]{0,80}\b(?:are|is) (?:advertisements or )?affiliate links?/i],
  ["some links are advertisements", /some of these links are advertisements/i],
];

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("K5: revenue-model wording is conditional while no affiliate link is live", () => {
  it("no affiliate or sponsored placement is rendered without configuration", () => {
    for (const key of Object.keys(process.env).filter((k) => k.startsWith("NEXT_PUBLIC_AFFILIATE_"))) {
      vi.stubEnv(key, "");
    }
    expect(AffiliateCTA({ categorySlug: "divorce" })).toBeNull();
    expect(AffiliateCTA({})).toBeNull();
  });

  it.each(POLICY_PAGES)("%s makes no present-tense affiliate or commission claim", async (path, render) => {
    const html = text(await render());
    for (const [name, pattern] of ACTIVE_CLAIMS) {
      expect(html, `${path}: ${name}`).not.toMatch(pattern);
    }
    for (const sentence of sentences(html)) {
      if (/commission|flat advertising fee/i.test(sentence)) {
        expect(sentence, `${path}: ${sentence}`).toMatch(/\bif we\b/i);
      }
    }
  });

  it("the home page and a state page, which would show affiliate blocks, mention none", async () => {
    for (const render of [
      () => renderPage(HomePage),
      () => renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never),
    ]) {
      const html = text(await render());
      expect(html).not.toMatch(/commission/i);
      expect(html).not.toMatch(/\baffiliate (?:link|partner)/i);
    }
  });

  it("Terms and Privacy describe affiliate links only as a labeled possibility", async () => {
    const terms = text(await renderPage(TermsPage));
    const privacy = text(await renderPage(PrivacyPage));
    expect(terms).toMatch(/if we add affiliate links[^.]*labeled/i);
    expect(terms).toMatch(/we may display advertisements/i);
    expect(privacy).toMatch(/if we add affiliate links[^.]*labeled/i);
    expect(privacy).not.toMatch(/\bClio\b/);
  });

  it("About says in one conditional sentence that the site may be funded by advertising", async () => {
    const about = text(await renderPage(AboutPage));
    expect(about).toMatch(/may be funded by advertising/i);
    expect(about).toMatch(/if we add affiliate links[^.]*labeled/i);
  });
});

describe("K5: one name for the Terms document", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) return walk(path);
      return /\.(tsx|ts)$/.test(name) ? [path] : [];
    });
  const strip = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("no source outside comments says Terms of Use", () => {
    const offenders = walk(join(ROOT, "src")).filter((f) => /terms of use/i.test(strip(readFileSync(f, "utf8"))));
    expect(offenders).toEqual([]);
  });

  it("the clickwrap checkbox links to the Terms of Service", () => {
    const html = text(
      renderToStaticMarkup(
        createElement(TermsGateCheckbox, { checked: false, onCheckedChange: () => {}, onAccept: () => {} }),
      ),
    );
    expect(html).toMatch(/I agree to the Terms of Service/);
    expect(html).not.toMatch(/Terms of Use/);
  });
});
