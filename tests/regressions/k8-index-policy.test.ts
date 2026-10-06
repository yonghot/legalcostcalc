import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderPage } from "./helpers/render";
import { INDEXABLE_PAGES, PAGE_INDEX, hasUniqueData } from "@/lib/page-index";
import { INDEXED_PAGES, createIndexPolicy, isIndexable } from "@/lib/index-policy";
import policyData from "@/data/index-policy.json";
import evidence from "@/data/k8-evidence.json";
import sitemap from "@/app/sitemap";
import { generateMetadata } from "@/app/[state]/[slug]/page";
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

describe("K8: shipped policy leaves live behavior unchanged", () => {
  it("ships keep null with empty lists", () => {
    expect(policyData).toEqual({ keep: null, noindex: [], exceptions: [] });
  });

  it("isIndexable equals hasUniqueData for every state and category", () => {
    for (const state of STATES) {
      for (const category of CATEGORIES) {
        expect(isIndexable(state.code, category.slug), `${state.code}/${category.slug}`).toBe(
          hasUniqueData(state.code, category.slug),
        );
      }
    }
  });

  it("INDEXED_PAGES holds the same paths as INDEXABLE_PAGES, while hubs keep reading INDEXABLE_PAGES", () => {
    expect(INDEXED_PAGES.map((p) => p.path)).toEqual(INDEXABLE_PAGES.map((p) => p.path));
  });

  it("the sitemap lists exactly the indexable template pages", () => {
    const paths = templatePaths(sitemap().map((e) => e.url));
    expect(paths).toEqual(new Set(INDEXABLE_PAGES.map((p) => p.path)));
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

  it("with the shipped policy robots meta and sitemap still agree for all 408 pages", async () => {
    for (const entry of PAGE_INDEX) {
      const meta = await generateMetadata({ params: Promise.resolve(slugParams(entry)) });
      expect(robotsAllowIndex(meta.robots), entry.path).toBe(entry.hasUniqueData);
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
