import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage, setPathname } from "./helpers/render";
import RootLayout from "@/app/layout";
import { INDEXABLE_PAGES, PAGE_INDEX } from "@/lib/page-index";
import { INDEXED_PAGES, createIndexPolicy, isIndexable } from "@/lib/index-policy";
import policyData from "@/data/index-policy.json";
import evidence from "@/data/k8-evidence.json";
import evidenceNov from "@/data/k8-evidence-2026-11.json";
import sitemap from "@/app/sitemap";
import StateCategoryPage, { generateMetadata } from "@/app/[state]/[slug]/page";
import StateHubPage from "@/app/[state]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

type Pair = { path: string; hasUniqueData: boolean; state: { code: string }; category: { slug: string } };

const pair = (state: string, category: string, unique = true): Pair => ({
  path: `/${state}/${category}-cost`,
  hasUniqueData: unique,
  state: { code: state.toUpperCase() },
  category: { slug: category },
});

const P1 = pair("alabama", "dui");
const P2 = pair("alaska", "dui");
const P3 = pair("arizona", "dui");
const P4 = pair("arkansas", "dui", false);
const PAGES = [P1, P2, P3, P4];

const idx = (p: Pair) => [p.state.code, p.category.slug] as const;

describe("K8: createIndexPolicy semantics", () => {
  it("keep null means no K8 filtering: indexable equals the information-gain gate", () => {
    const policy = createIndexPolicy({ keep: null, noindex: [], exceptions: [] }, PAGES);
    expect(policy.isIndexable(...idx(P1))).toBe(true);
    expect(policy.isIndexable(...idx(P2))).toBe(true);
    expect(policy.isIndexable(...idx(P3))).toBe(true);
    expect(policy.isIndexable(...idx(P4))).toBe(false);
    expect(policy.indexedPages).toEqual([P1, P2, P3]);
  });

  it("a keep list restricts indexing to the listed paths", () => {
    const policy = createIndexPolicy({ keep: [P1.path, P2.path], noindex: [], exceptions: [] }, PAGES);
    expect(policy.indexedPages).toEqual([P1, P2]);
    expect(policy.isIndexable(...idx(P3))).toBe(false);
  });

  it("an empty keep list indexes nothing", () => {
    const policy = createIndexPolicy({ keep: [], noindex: [], exceptions: [] }, PAGES);
    expect(policy.indexedPages).toEqual([]);
  });

  it("exceptions are indexable next to a keep list", () => {
    const policy = createIndexPolicy({ keep: [P1.path], noindex: [], exceptions: [P3.path] }, PAGES);
    expect(policy.indexedPages).toEqual([P1, P3]);
    expect(policy.isIndexable(...idx(P2))).toBe(false);
  });

  it("noindex always wins, over keep, exceptions and the default", () => {
    const withNull = createIndexPolicy({ keep: null, noindex: [P2.path], exceptions: [] }, PAGES);
    expect(withNull.indexedPages).toEqual([P1, P3]);
    const withKeep = createIndexPolicy(
      { keep: [P1.path, P2.path], noindex: [P2.path], exceptions: [P2.path] },
      PAGES,
    );
    expect(withKeep.indexedPages).toEqual([P1]);
  });

  it("the information-gain gate still applies to listed paths", () => {
    const policy = createIndexPolicy({ keep: [P4.path], noindex: [], exceptions: [P4.path] }, PAGES);
    expect(policy.isIndexable(...idx(P4))).toBe(false);
  });

  it("an unknown pair is never indexable", () => {
    const policy = createIndexPolicy({ keep: null, noindex: [], exceptions: [] }, PAGES);
    expect(policy.isIndexable("ZZ", "dui")).toBe(false);
  });

  it("rejects a path that is not a page, so a typo cannot silently drop a page", () => {
    expect(() =>
      createIndexPolicy({ keep: ["/alabama/not-a-matter-cost"], noindex: [], exceptions: [] }, PAGES),
    ).toThrow(/not-a-matter-cost/);
    expect(() =>
      createIndexPolicy({ keep: null, noindex: ["/nowhere/dui-cost"], exceptions: [] }, PAGES),
    ).toThrow(/nowhere/);
  });
});

const DIVORCE_EXCEPTIONS = ["/new-york/divorce-cost", "/california/divorce-cost"];
const EVIDENCE_PATHS = [...evidence.paths.map((p) => p.path), ...evidenceNov.paths.map((p) => p.path)];
const KEPT = new Set([...EVIDENCE_PATHS, ...DIVORCE_EXCEPTIONS]);

describe("K8: shipped policy keeps traffic-earning and sourced pages, noindexes the rest", () => {
  it("keeps the 67 evidence paths (39 from the 90-day file, 28 from the 2026-11 landing file), the two divorce exceptions and lists nothing else", () => {
    expect(new Set(policyData.keep)).toEqual(new Set(EVIDENCE_PATHS));
    expect(policyData.keep).toHaveLength(67);
    expect(evidenceNov.paths).toHaveLength(28);
    for (const p of evidenceNov.paths) expect(p.organicSessions, p.path).toBeGreaterThanOrEqual(1);
    expect(evidenceNov.paths.filter((p) => evidence.paths.some((q) => q.path === p.path))).toEqual([]);
    expect(policyData.exceptions).toEqual(DIVORCE_EXCEPTIONS);
    expect(policyData.noindex).toEqual([]);
  });

  it("counts: 369 pass the information-gain gate, 69 stay indexable, 300 become noindex,follow", () => {
    expect(INDEXABLE_PAGES).toHaveLength(369);
    expect(INDEXED_PAGES).toHaveLength(69);
    const dropped = INDEXABLE_PAGES.filter((p) => !isIndexable(p.state.code, p.category.slug));
    expect(dropped).toHaveLength(300);
    expect(INDEXED_PAGES.map((p) => p.path).sort()).toEqual([...KEPT].sort());
  });

  it("isIndexable is true exactly for the kept paths, for all 408 pairs", () => {
    for (const entry of PAGE_INDEX) {
      expect(isIndexable(entry.state.code, entry.category.slug), entry.path).toBe(KEPT.has(entry.path));
    }
  });

  it("every kept path is a real page that passes the gate, so no kept page is dropped silently", () => {
    for (const path of KEPT) {
      const entry = PAGE_INDEX.find((p) => p.path === path);
      expect(entry, path).toBeDefined();
      expect(entry!.hasUniqueData, path).toBe(true);
    }
  });

  it("the sitemap lists the 69 kept template pages and every hub, guide, tool page and the updates page", () => {
    const urls = sitemap().map((e) => e.url);
    expect(templatePaths(urls)).toEqual(KEPT);
    const nonTemplate = urls.filter((u) => !/^\/[a-z-]+\/[a-z-]+-cost$/.test(new URL(u).pathname));
    expect(nonTemplate).toHaveLength(9 + STATES.length + CATEGORIES.length);
    expect(urls).toHaveLength(9 + STATES.length + CATEGORIES.length + 69);
  });

  it("robots meta is index for kept pages and noindex,follow for every other page, 408 pages", async () => {
    for (const entry of PAGE_INDEX) {
      const meta = await generateMetadata({ params: Promise.resolve(slugParams(entry)) });
      if (KEPT.has(entry.path)) {
        expect(robotsAllowIndex(meta.robots), entry.path).toBe(true);
      } else {
        expect(meta.robots, entry.path).toMatchObject({ index: false, follow: true });
      }
    }
  });

  it("the sitemap, the robots meta and the gate-passing set agree page by page", async () => {
    const inSitemap = templatePaths(sitemap().map((e) => e.url));
    for (const entry of INDEXABLE_PAGES) {
      const meta = await generateMetadata({ params: Promise.resolve(slugParams(entry)) });
      expect(robotsAllowIndex(meta.robots), entry.path).toBe(inSitemap.has(entry.path));
    }
  });
});

const NOINDEXED_SAMPLE = [
  "/texas/divorce-cost",
  "/texas/personal-injury-cost",
  "/new-york/dui-cost",
  "/ohio/estate-planning-cost",
  "/wyoming/immigration-cost",
  "/illinois/real-estate-cost",
];
const KEPT_SAMPLE = [
  "/massachusetts/bankruptcy-cost",
  "/california/divorce-cost",
  "/new-york/divorce-cost",
  "/oregon/criminal-defense-cost",
];
const LOADER = '<script id="adsense-loader"';

async function inLayout(entry: (typeof PAGE_INDEX)[number]): Promise<string> {
  setPathname(entry.path);
  const page = await StateCategoryPage({ params: Promise.resolve(slugParams(entry)) });
  return renderToStaticMarkup(createElement(RootLayout, null, page));
}

describe("K8: rendered pages under the shipped policy", () => {
  it.each(NOINDEXED_SAMPLE)("%s stays reachable, has no ad loader, and its hubs still link it", async (path) => {
    const entry = PAGE_INDEX.find((p) => p.path === path)!;
    expect(entry.hasUniqueData, path).toBe(true);
    expect(KEPT.has(path), path).toBe(false);
    const html = await inLayout(entry);
    expect(html).toContain("<h1");
    expect(html).not.toContain(LOADER);
    expect(html).not.toContain("adsbygoogle.js");
    const stateHub = await renderPage(StateHubPage as never, { state: entry.state.slug } as never);
    expect(stateHub).toContain(`href="${path}"`);
    const categoryHub = await renderPage(CategoryHubPage as never, { category: entry.category.slug } as never);
    expect(categoryHub).toContain(`href="${path}"`);
  });

  it.each(KEPT_SAMPLE)("%s keeps exactly one ad loader", async (path) => {
    const entry = PAGE_INDEX.find((p) => p.path === path)!;
    const html = await inLayout(entry);
    expect(html.split(LOADER).length - 1).toBe(1);
  });

  it.each(KEPT_SAMPLE)("%s links to other matter pages only when those are kept", async (path) => {
    const entry = PAGE_INDEX.find((p) => p.path === path)!;
    const html = await renderPage(StateCategoryPage as never, slugParams(entry) as never);
    const linked = [...html.matchAll(/<a\b[^>]*\bhref="(\/[a-z-]+\/[a-z-]+-cost)"/g)].map((m) => m[1]);
    expect(linked.length).toBeGreaterThan(0);
    for (const href of linked) expect(KEPT.has(href), `${path} -> ${href}`).toBe(true);
  });
});

function templatePaths(urls: string[]): Set<string> {
  return new Set(
    urls.map((u) => new URL(u).pathname).filter((p) => /^\/[a-z-]+\/[a-z-]+-cost$/.test(p)),
  );
}

type MetaLoader = {
  sitemap: () => Array<{ url: string }>;
  generateMetadata: (props: { params: Promise<{ state: string; slug: string }> }) => Promise<{
    robots?: unknown;
  }>;
  StateCategoryPage: (props: { params: Promise<{ state: string; slug: string }> }) => Promise<unknown>;
  StatePage: (props: { params: Promise<{ state: string }> }) => Promise<unknown>;
  CategoryPage: (props: { params: Promise<{ category: string }> }) => Promise<unknown>;
};

async function loadWithPolicy(policy: unknown): Promise<MetaLoader> {
  vi.resetModules();
  vi.doMock("@/data/index-policy.json", () => ({ default: policy }));
  const [sm, slug, state, category] = await Promise.all([
    import("@/app/sitemap"),
    import("@/app/[state]/[slug]/page"),
    import("@/app/[state]/page"),
    import("@/app/category/[category]/page"),
  ]);
  return {
    sitemap: sm.default,
    generateMetadata: slug.generateMetadata as MetaLoader["generateMetadata"],
    StateCategoryPage: slug.default as MetaLoader["StateCategoryPage"],
    StatePage: state.default as MetaLoader["StatePage"],
    CategoryPage: category.default as MetaLoader["CategoryPage"],
  };
}

function robotsAllowIndex(robots: unknown): boolean {
  if (!robots || typeof robots !== "object") return true;
  return (robots as { index?: boolean }).index !== false;
}

const slugParams = (p: Pair & { path: string }) => {
  const [, state, slug] = p.path.split("/");
  return { state, slug };
};

describe("K8: sitemap, robots meta and hubs agree under an injected policy", () => {
  afterEach(() => {
    vi.doUnmock("@/data/index-policy.json");
    vi.resetModules();
  });

  const unique = PAGE_INDEX.filter((p) => p.hasUniqueData);
  const A = unique[0];
  const B = unique[1];
  const C = unique[2];
  const thin = PAGE_INDEX.find((p) => !p.hasUniqueData);

  it("with keep=[A,B] only A and B stay in the sitemap among template pages", async () => {
    const m = await loadWithPolicy({ keep: [A.path, B.path], noindex: [], exceptions: [] });
    expect(templatePaths(m.sitemap().map((e) => e.url))).toEqual(new Set([A.path, B.path]));
  });

  it("robots meta matches sitemap membership for all 408 pages, and non-kept pages are noindex,follow", async () => {
    const m = await loadWithPolicy({ keep: [A.path, B.path], noindex: [], exceptions: [] });
    const inSitemap = templatePaths(m.sitemap().map((e) => e.url));
    for (const entry of PAGE_INDEX) {
      const meta = await m.generateMetadata({ params: Promise.resolve(slugParams(entry)) });
      expect(robotsAllowIndex(meta.robots), entry.path).toBe(inSitemap.has(entry.path));
    }
    const noindexed = await m.generateMetadata({ params: Promise.resolve(slugParams(C)) });
    expect(noindexed.robots).toMatchObject({ index: false, follow: true });
  });

  it("with the shipped policy robots meta follows isIndexable for all 408 pages", async () => {
    for (const entry of PAGE_INDEX) {
      const meta = await generateMetadata({ params: Promise.resolve(slugParams(entry)) });
      expect(robotsAllowIndex(meta.robots), entry.path).toBe(isIndexable(entry.state.code, entry.category.slug));
    }
  });

  it("a noindexed page keeps rendering (no 404) and hubs still link every hasUniqueData page", async () => {
    const m = await loadWithPolicy({ keep: [A.path, B.path], noindex: [], exceptions: [] });
    const html = await renderPage(m.StateCategoryPage as never, slugParams(C) as never);
    expect(html).toContain("<h1");

    const stateHub = await renderPage(m.StatePage as never, { state: C.state.slug } as never);
    for (const p of unique.filter((u) => u.state.code === C.state.code)) {
      expect(stateHub, p.path).toContain(`href="${p.path}"`);
    }
    const categoryHub = await renderPage(m.CategoryPage as never, { category: C.category.slug } as never);
    for (const p of unique.filter((u) => u.category.slug === C.category.slug)) {
      expect(categoryHub, p.path).toContain(`href="${p.path}"`);
    }
  });

  it("a thin page stays noindex whatever the keep list says", async () => {
    expect(thin).toBeDefined();
    const m = await loadWithPolicy({ keep: [thin!.path], noindex: [], exceptions: [thin!.path] });
    const meta = await m.generateMetadata({ params: Promise.resolve(slugParams(thin!)) });
    expect(robotsAllowIndex(meta.robots)).toBe(false);
    expect(templatePaths(m.sitemap().map((e) => e.url)).has(thin!.path)).toBe(false);
  });
});

describe("K8: traffic evidence file", () => {
  const paths = evidence.paths;

  it("records provenance", () => {
    expect(evidence.generatedFrom).toBe("ga4-pages-host-90d.csv");
    expect(evidence.host).toBe("legalcostcalc.co");
    expect(evidence.window).toEqual({ start: "2026-07-08", end: "2026-10-05" });
  });

  it("lists the 39 eligible state and category paths once each, all real pages with unique data", () => {
    expect(paths).toHaveLength(39);
    expect(new Set(paths.map((p) => p.path)).size).toBe(39);
    for (const row of paths) {
      expect(row.path, row.path).toMatch(/^\/[a-z-]+\/[a-z-]+-cost$/);
      const entry = PAGE_INDEX.find((p) => p.path === row.path);
      expect(entry, row.path).toBeDefined();
      expect(entry!.hasUniqueData, row.path).toBe(true);
      expect(row.organicViews + row.aiViews + row.referralViews, row.path).toBeGreaterThanOrEqual(1);
    }
  });

  it("recounts to the 87 organic views the export reports for these paths", () => {
    expect(paths.reduce((sum, p) => sum + p.organicViews, 0)).toBe(87);
  });

  it("is evidence only: the index policy module never reads it", () => {
    const source = readFileSync(join(__dirname, "..", "..", "src", "lib", "index-policy.ts"), "utf8");
    expect(source).not.toMatch(/k8-evidence/);
  });
});
