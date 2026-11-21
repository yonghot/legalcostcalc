import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement, isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import evidence from "@/data/k8-evidence.json";
import sitemap from "@/app/sitemap";
import HomePage from "@/app/page";
import StateHubPage from "@/app/[state]/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import CategoryHubPage from "@/app/category/[category]/page";
import CompareLayout from "@/app/compare/layout";
import ComparePage from "@/app/compare/page";
import DivorceHubPage from "@/app/divorce-cost-by-state/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import AboutPage from "@/app/about/page";
import EmbedIndexPage from "@/app/embed/page";
import SettlementEstimatorPage from "@/app/settlement-estimator/page";
import { CostResult } from "@/components/calculator/cost-result";
import { HubLinksBar } from "@/components/seo/hub-links-bar";
import { RelatedLinks } from "@/components/seo/related-links";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { CATEGORIES } from "@/lib/constants/categories";
import { DEFAULT_STATE_SLUG } from "@/lib/constants/costs";
import { STATES } from "@/lib/constants/states";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import { INDEXED_PAGES, isIndexable } from "@/lib/index-policy";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { getFamilyDate } from "@/lib/content-dates";
import type { LegalCostData } from "@/lib/types";

const HREF = /<a\b[^>]*\bhref="(\/[^"#?]*)"/g;

function hrefsIn(html: string): Set<string> {
  return new Set([...html.matchAll(HREF)].map((m) => (m[1].length > 1 ? m[1].replace(/\/$/, "") : m[1])));
}

const totalViews = (p: { organicViews: number; aiViews: number; referralViews: number }) =>
  p.organicViews + p.aiViews + p.referralViews;

const EVIDENCE_PATHS = evidence.paths
  .map((p) => ({ path: p.path, views: totalViews(p) }))
  .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path));

const indexedPaths = new Set(INDEXED_PAGES.map((p) => p.path));
const TOP_EVIDENCE = EVIDENCE_PATHS.filter((p) => indexedPaths.has(p.path));

const COST: LegalCostData = {
  id: "test-pi-tx-moderate",
  category: "personal-injury",
  stateCode: "TX",
  complexity: "moderate",
  costRange: { low: 2300, median: 5700, high: 11400 },
  hourlyRate: { low: 0, median: 0, high: 0 },
  contingencyFee: { low: 33, median: 33, high: 40 },
  typicalDuration: "9-18 months",
  commonFees: ["Medical records", "Expert witness"],
  sources: ["https://example.com/a", "https://example.com/b"],
  lastVerifiedAt: "2026-04-01",
};

function renderResult(categorySlug: string, categoryName: string): string {
  return renderToStaticMarkup(
    createElement(CostResult, {
      results: [{ ...COST, category: categorySlug }],
      stateName: "Texas",
      categoryName,
      categorySlug,
      stateCode: "TX",
      stateSlug: "texas",
    }),
  );
}

describe("K24: home links to the pages that already earn visits", () => {
  it("the evidence file yields at least three indexable pages", () => {
    expect(TOP_EVIDENCE.length).toBeGreaterThanOrEqual(3);
    expect(TOP_EVIDENCE[0].path).toBe("/massachusetts/bankruptcy-cost");
  });

  it("home links to the three most visited evidence pages with descriptive anchors", async () => {
    const html = await renderPage(HomePage);
    for (const { path } of TOP_EVIDENCE.slice(0, 3)) {
      const [, stateSlug, slug] = path.split("/");
      const state = STATES.find((s) => s.slug === stateSlug)!;
      const category = CATEGORIES.find((c) => `${c.slug}-cost` === slug)!;
      const anchors = [...html.matchAll(new RegExp(String.raw`<a\b[^>]*href="${path}"[^>]*>([\s\S]*?)</a>`, "g"))];
      const texts = anchors.map((m) => m[1].replace(/<[^>]+>/g, "").trim());
      expect(texts, path).toContain(`${category.displayName} cost in ${state.name}`);
    }
  });

  it("every evidence link on home goes to a page the index policy keeps", async () => {
    const html = await renderPage(HomePage);
    const linked = [...hrefsIn(html)].filter((h) => evidence.paths.some((p) => p.path === h));
    expect(linked.length).toBeGreaterThanOrEqual(3);
    for (const href of linked) expect(indexedPaths.has(href), href).toBe(true);
  });

  it("the category hub lifts its own visited pages into a popular block", async () => {
    const html = await renderPage(CategoryHubPage, { category: "bankruptcy" });
    const block = html.match(/<section[^>]*aria-labelledby="popular-pages-heading"[\s\S]*?<\/section>/)?.[0];
    expect(block).toBeDefined();
    const inBlock = hrefsIn(block!);
    expect(inBlock.has("/massachusetts/bankruptcy-cost")).toBe(true);
    for (const href of inBlock) expect(href.endsWith("/bankruptcy-cost"), href).toBe(true);
  });
});

describe("K26: next steps right after the result", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("personal-injury results link the settlement estimator, the guide and the state comparison", () => {
    const html = renderResult("personal-injury", "Personal Injury");
    const hrefs = hrefsIn(html);
    expect(hrefs.has("/settlement-estimator")).toBe(true);
    expect(hrefs.has("/how-legal-fees-work")).toBe(true);
    expect(hrefs.has("/category/personal-injury")).toBe(true);
  });

  it("other matters do not get the settlement estimator", () => {
    const hrefs = hrefsIn(renderResult("divorce", "Divorce"));
    expect(hrefs.has("/settlement-estimator")).toBe(false);
    expect(hrefs.has("/category/divorce")).toBe(true);
    expect(hrefs.has("/how-legal-fees-work")).toBe(true);
  });

  it("the block holds two or three steps", async () => {
    const { nextStepsFor } = await import("@/components/calculator/next-steps");
    expect(nextStepsFor("personal-injury", "Personal Injury").length).toBe(3);
    expect(nextStepsFor("divorce", "Divorce").length).toBe(2);
  });

  it("each click emits related_click for the next_step module with the step slot and target, and nothing derived from inputs", async () => {
    const calls: unknown[][] = [];
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null },
      gtag: (...args: unknown[]) => calls.push(args),
    });
    const { NextSteps } = await import("@/components/calculator/next-steps");
    const links: Array<{ href: string; onClick: () => void }> = [];
    const walk = (node: ReactNode): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!isValidElement(node)) return;
      const props = (node as ReactElement<{ href?: string; onClick?: () => void; children?: ReactNode }>).props;
      if (typeof props.href === "string" && typeof props.onClick === "function") {
        links.push({ href: props.href, onClick: props.onClick });
      }
      walk(props.children);
    };
    walk(NextSteps({ categorySlug: "personal-injury", categoryName: "Personal Injury" }));
    expect(links.map((l) => l.href).sort()).toEqual(
      ["/category/personal-injury", "/how-legal-fees-work", "/settlement-estimator"].sort(),
    );
    for (const link of links) link.onClick();
    expect(calls).toHaveLength(3);
    const steps = calls.map((c) => c[2] as Record<string, unknown>);
    for (const [, name] of calls as Array<[string, string]>) expect(name).toBe("related_click");
    for (const s of steps) expect(s.link_module).toBe("next_step");
    expect(steps.map((s) => s.link_context).sort()).toEqual(["result_category_hub", "result_guide", "result_settlement_estimator"]);
    expect(steps.map((s) => s.link_url).sort()).toEqual(links.map((l) => l.href).sort());
    for (const s of steps) {
      expect(Object.keys(s).sort()).toEqual(["link_context", "link_module", "link_url", "site"]);
    }
  });
});

describe("K24: settlement estimator is a linked, listed page", () => {
  const pi = INDEXABLE_PAGES.find((p) => p.category.slug === "personal-injury")!;

  it("every personal-injury hub bar links to it and other matters do not", () => {
    const bar = (categorySlug: string, categoryName: string) =>
      renderToStaticMarkup(
        createElement(HubLinksBar, { stateSlug: "texas", stateName: "Texas", categorySlug, categoryName }),
      );
    expect(hrefsIn(bar("personal-injury", "Personal Injury")).has("/settlement-estimator")).toBe(true);
    expect(hrefsIn(bar("dui", "DUI")).has("/settlement-estimator")).toBe(false);
  });

  it("a rendered personal-injury page links to it from the body, not only from site chrome", async () => {
    const html = await renderPage(StateCategoryPage, { state: pi.state.slug, slug: "personal-injury-cost" });
    expect(hrefsIn(html).has("/settlement-estimator")).toBe(true);
  });

  it("sitemap lists it with the date of its own last content change", () => {
    const entry = sitemap().find((e) => e.url === `${CANONICAL_ORIGIN}/settlement-estimator`);
    expect(entry).toBeDefined();
    const record = getFamilyDate("page:settlement-estimator");
    expect(record?.basis).toBe("content-changed");
    expect(entry!.lastModified).toBe(record!.date);
  });
});

describe("K24 with the K8 index policy: hubs stay reachable and noindexed pages get no bulk links", () => {
  const TEMPLATE_HREF = /^\/[a-z-]+\/[a-z-]+-cost$/;

  it("home links every state hub, so a state without a kept matter page is not an orphan", async () => {
    const hrefs = hrefsIn(await renderPage(HomePage));
    for (const state of STATES) expect(hrefs.has(`/${state.slug}`), state.slug).toBe(true);
  });

  it("home links matter pages only where the index policy keeps them, apart from the eight category cards", async () => {
    const hrefs = [...hrefsIn(await renderPage(HomePage))].filter((h) => TEMPLATE_HREF.test(h));
    const kept = new Set(INDEXED_PAGES.map((p) => p.path));
    const cards = new Set(CATEGORIES.map((c) => `/${DEFAULT_STATE_SLUG}/${c.slug}-cost`));
    const strays = hrefs.filter((h) => !kept.has(h) && !cards.has(h));
    expect(strays).toEqual([]);
  });

  it("the fees guide links the settlement estimator from its own body", async () => {
    const hrefs = hrefsIn(await renderPage(GuidePage as never));
    expect(hrefs.has("/settlement-estimator")).toBe(true);
  });
});

describe("K24: no listed page lacks an inbound content link", () => {
  const nodes = new Set(
    sitemap().map((e) => {
      const path = e.url.replace(CANONICAL_ORIGIN, "");
      return path === "" ? "/" : path;
    }),
  );

  async function buildInbound(): Promise<Map<string, Set<string>>> {
    const inbound = new Map<string, Set<string>>([...nodes].map((n) => [n, new Set<string>()]));
    const addFrom = (source: string, html: string) => {
      for (const href of hrefsIn(html)) {
        if (href !== source && inbound.has(href)) inbound.get(href)!.add(source);
      }
    };

    addFrom("/", await renderPage(HomePage));
    for (const state of STATES) addFrom(`/${state.slug}`, await renderPage(StateHubPage, { state: state.slug }));
    for (const cat of CATEGORIES) addFrom(`/category/${cat.slug}`, await renderPage(CategoryHubPage, { category: cat.slug }));
    addFrom("/compare", renderToStaticMarkup(createElement(CompareLayout, null, createElement(ComparePage))));
    addFrom("/divorce-cost-by-state", await renderPage(DivorceHubPage as never));
    addFrom("/legal-cost-statistics", await renderPage(StatisticsPage as never));
    addFrom("/how-legal-fees-work", await renderPage(GuidePage as never));
    addFrom("/about", await renderPage(AboutPage as never));
    addFrom("/embed", await renderPage(EmbedIndexPage as never));
    addFrom("/settlement-estimator", await renderPage(SettlementEstimatorPage as never));

    const onePerCategory = CATEGORIES.flatMap((c) => INDEXED_PAGES.find((p) => p.category.slug === c.slug) ?? []);
    for (const page of onePerCategory) {
      addFrom(page.path, await renderPage(StateCategoryPage, { state: page.state.slug, slug: `${page.category.slug}-cost` }));
    }

    for (const page of INDEXED_PAGES) {
      const others = CATEGORIES.filter((c) => c.slug !== page.category.slug && isIndexable(page.state.code, c.slug));
      const otherStates = STATES.filter((s) => s.code !== page.state.code && isIndexable(s.code, page.category.slug));
      const hubStateCount = INDEXABLE_PAGES.filter((p) => p.category.slug === page.category.slug).length;
      const trail = [
        { name: "Home", href: "/" },
        { name: page.state.name, href: `/${page.state.slug}` },
        { name: page.category.displayName, href: page.path },
      ];
      addFrom(
        page.path,
        renderToStaticMarkup(
          createElement(
            "div",
            null,
            createElement(Breadcrumbs, { items: trail }),
            createElement(HubLinksBar, {
              stateSlug: page.state.slug,
              stateName: page.state.name,
              categorySlug: page.category.slug,
              categoryName: page.category.displayName,
            }),
            createElement(RelatedLinks, {
              stateInfo: page.state,
              categoryInfo: page.category,
              otherCategories: others,
              allOtherStates: otherStates,
              hubStateCount,
            }),
          ),
        ),
      );
    }
    return inbound;
  }

  it("the listed pages include the settlement estimator", () => {
    expect(nodes.has("/settlement-estimator")).toBe(true);
  });

  it("every listed page except home has at least one inbound link from another listed page's own content", async () => {
    const inbound = await buildInbound();
    const orphans = [...inbound].filter(([path, from]) => path !== "/" && path !== "/updates" && from.size === 0).map(([path]) => path);
    expect(orphans).toEqual([]);
  }, 60_000);
});
