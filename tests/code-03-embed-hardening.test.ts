/**
 * tests/code-03-embed-hardening.test.ts
 *
 * CODE-03 (부속P §4) — harden the embeddable-widget backlink engine:
 *   (a) attribution backlink carries rel="nofollow ugc" (not "nofollow
 *       sponsored") on both the live /embed/[state]/[slug] page and the
 *       copy-paste snippet.
 *   (b) "Embed this calculator" copy-to-clipboard panel is available on the
 *       main calculator page.
 *   (c) embed pages stay noindex.
 *   (d) postMessage height-resize is wired (embed side + snippet listener).
 *   (e) embed_loaded GA4 event still fires with the referring host param.
 *   No followed (dofollow) link is ever emitted from any embed surface.
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import EmbedCalculatorPage from "@/app/embed/[state]/[slug]/page";

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

describe("CODE-03 — embed attribution link is rel=nofollow ugc, never dofollow/sponsored", () => {
  it("the live embed page's attribution anchor carries rel=noopener nofollow ugc", async () => {
    const jsx = await EmbedCalculatorPage({
      params: Promise.resolve({ state: "california", slug: "divorce-cost" }),
    });
    const html = renderToStaticMarkup(jsx);
    expect(html).toContain("Powered by LegalCostCalc");
    expect(html).toMatch(/rel="noopener nofollow ugc"/);
    expect(html).not.toContain("nofollow sponsored");
    // rel must include both tokens Google requires for widget links. Match the
    // ATTRIBUTION anchor specifically rather than the document's first rel=:
    // the embed body also renders source-attribution links (rel="noopener
    // noreferrer"), and which one comes first is a layout detail, not a policy.
    const labelAt = html.indexOf("Powered by LegalCostCalc");
    expect(labelAt).toBeGreaterThan(-1);
    const anchorAt = html.lastIndexOf("<a", labelAt);
    expect(anchorAt).toBeGreaterThan(-1);
    const attributionAnchor = html.slice(anchorAt, labelAt);
    const relMatch = attributionAnchor.match(/rel="([^"]*)"/);
    expect(relMatch).not.toBeNull();
    expect(relMatch![1]).toContain("nofollow");
    expect(relMatch![1]).toContain("ugc");
  });

  it("embed-snippet.tsx's copy-paste markup uses rel=nofollow ugc, never sponsored", () => {
    const src = readSource("src/components/embed/embed-snippet.tsx");
    expect(src).toMatch(/rel="noopener nofollow ugc"/);
    expect(src).not.toMatch(/nofollow sponsored/);
  });

  it("no source file anywhere still emits a nofollow-sponsored embed attribution", () => {
    const embedPageSrc = readSource("src/app/embed/[state]/[slug]/page.tsx");
    const snippetSrc = readSource("src/components/embed/embed-snippet.tsx");
    expect(embedPageSrc).not.toContain("nofollow sponsored");
    expect(snippetSrc).not.toContain("nofollow sponsored");
  });
});

describe("CODE-03 — embed pages stay noindex", () => {
  it("generateMetadata for /embed/[state]/[slug] sets robots index:false", async () => {
    const mod = await import("@/app/embed/[state]/[slug]/page");
    const metadata = await mod.generateMetadata({
      params: Promise.resolve({ state: "california", slug: "divorce-cost" }),
    });
    expect(metadata.robots).toMatchObject({ index: false });
  });
});

describe("CODE-03 — 'Embed this calculator' panel on the main calculator page", () => {
  it("src/app/[state]/[slug]/page.tsx renders <EmbedPanel>", () => {
    const src = readSource("src/app/[state]/[slug]/page.tsx");
    expect(src).toMatch(/<EmbedPanel/);
    expect(src).toMatch(/import\s*\{\s*EmbedPanel\s*\}/);
  });

  it("EmbedPanel wraps the same EmbedSnippet component used on /embed (identical markup/rel policy everywhere)", () => {
    const src = readSource("src/components/embed/embed-panel.tsx");
    expect(src).toMatch(/import\s*\{\s*EmbedSnippet\s*\}/);
    expect(src).toMatch(/<EmbedSnippet/);
  });
});

describe("CODE-03 — postMessage height-resize wiring", () => {
  it("the embed page renders <EmbedResizeReporter> which posts height via postMessage", () => {
    const embedPageSrc = readSource("src/app/embed/[state]/[slug]/page.tsx");
    expect(embedPageSrc).toMatch(/<EmbedResizeReporter/);

    const reporterSrc = readSource("src/components/embed/embed-resize-reporter.tsx");
    expect(reporterSrc).toMatch(/window\.parent\?\.postMessage/);
    expect(reporterSrc).toMatch(/legalcostcalc:embed-resize/);
  });

  it("the copy-paste snippet includes a matching listener script that resizes the host <iframe>", () => {
    const snippetSrc = readSource("src/components/embed/embed-snippet.tsx");
    expect(snippetSrc).toMatch(/legalcostcalc:embed-resize/);
    expect(snippetSrc).toMatch(/addEventListener\("message"/);
  });
});

describe("CODE-03 — GA4 embed_loaded still fires with the referring host param", () => {
  it("embed-loaded-tracker.tsx fires embed_loaded with host_domain derived from document.referrer", () => {
    const src = readSource("src/components/embed/embed-loaded-tracker.tsx");
    expect(src).toMatch(/trackEvent\("embed_loaded"/);
    expect(src).toMatch(/host_domain/);
    expect(src).toMatch(/document\.referrer/);
  });

  it("the embed page still renders <EmbedLoadedTracker>", () => {
    const embedPageSrc = readSource("src/app/embed/[state]/[slug]/page.tsx");
    expect(embedPageSrc).toMatch(/<EmbedLoadedTracker/);
  });
});

describe("CODE-03 — the same GEO answer block is wired into the embed page", () => {
  it("embed page imports and renders <AnswerBlock> built via buildAnswerBlock", () => {
    const embedPageSrc = readSource("src/app/embed/[state]/[slug]/page.tsx");
    expect(embedPageSrc).toMatch(/<AnswerBlock/);
    expect(embedPageSrc).toMatch(/buildAnswerBlock/);
  });
});
