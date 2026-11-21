import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { setPathname } from "./helpers/render";
import RootLayout from "@/app/layout";
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
import ContactPage from "@/app/contact/page";
import PrivacyPage from "@/app/privacy/page";
import TermsPage from "@/app/terms/page";
import EmbedIndexPage from "@/app/embed/page";
import SettlementEstimatorPage from "@/app/settlement-estimator/page";
import SearchPage from "@/app/search/page";
import UpdatesPage from "@/app/updates/page";
import EmbedCalculatorPage from "@/app/embed/[state]/[slug]/page";
import NotFound from "@/app/not-found";
import ErrorBoundary from "@/app/error";
import { PAGE_INDEX } from "@/lib/page-index";

const ROOT = join(__dirname, "..", "..");
const APP_DIR = join(ROOT, "src", "app");

const INCLUDE_ROUTES = [
  "/",
  "/[state]",
  "/[state]/[slug]",
  "/category/[category]",
  "/compare",
  "/divorce-cost-by-state",
  "/legal-cost-statistics",
  "/how-legal-fees-work",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/embed",
  "/settlement-estimator",
];
const EXCLUDE_ROUTES = ["/embed/[state]/[slug]", "/search", "/updates"];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function routeOf(pageFile: string): string {
  const dir = relative(APP_DIR, dirname(pageFile)).split(sep).filter((s) => s && !/^\(.*\)$/.test(s));
  return "/" + dir.join("/");
}

const read = (file: string) =>
  readFileSync(file, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

const PAGE_FILES = walk(APP_DIR).filter((f) => /[\\/]page\.tsx$/.test(f));

const PRESENT = '<script id="adsense-loader"';

function loaderCount(html: string): number {
  return html.split(PRESENT).length - 1;
}

async function inLayout(pathname: string, element: ReactNode | Promise<ReactNode>): Promise<string> {
  setPathname(pathname);
  return renderToStaticMarkup(createElement(RootLayout, null, await element));
}

const params = <T,>(value: T) => ({ params: Promise.resolve(value) });

const INCLUDED: Array<[string, () => ReactNode | Promise<ReactNode>]> = [
  ["/", () => HomePage()],
  ["/california", () => StateHubPage(params({ state: "california" }))],
  ["/california/divorce-cost", () => StateCategoryPage(params({ state: "california", slug: "divorce-cost" }))],
  ["/category/divorce", () => CategoryHubPage(params({ category: "divorce" }))],
  ["/compare", () => createElement(CompareLayout, null, createElement(ComparePage))],
  ["/divorce-cost-by-state", () => DivorceHubPage()],
  ["/legal-cost-statistics", () => StatisticsPage()],
  ["/how-legal-fees-work", () => GuidePage()],
  ["/about", () => AboutPage()],
  ["/contact", () => ContactPage()],
  ["/privacy", () => PrivacyPage()],
  ["/terms", () => TermsPage()],
  ["/embed", () => EmbedIndexPage()],
  ["/settlement-estimator", () => SettlementEstimatorPage()],
];

const thinPage = PAGE_INDEX.find((p) => !p.hasUniqueData);

const EXCLUDED: Array<[string, string, () => ReactNode | Promise<ReactNode>]> = [
  [
    "embed frame /embed/california/divorce-cost",
    "/embed/california/divorce-cost",
    () => EmbedCalculatorPage(params({ state: "california", slug: "divorce-cost" })),
  ],
  [
    "/search with no results",
    "/search",
    () => SearchPage({ searchParams: Promise.resolve({ q: "zzzzqq" }) }),
  ],
  ["/updates", "/updates", () => UpdatesPage()],
  ["404 (not-found)", "/texas/not-a-real-cost", () => NotFound()],
  [
    "error boundary (the gate is by path, so an eligible path keeps the document-level loader)",
    "/search",
    () => createElement(ErrorBoundary, { error: new Error("boom"), reset: () => {} }),
  ],
  [
    `non-indexable instance ${thinPage?.path}`,
    thinPage?.path ?? "/",
    () => StateCategoryPage(params({ state: thinPage!.state.slug, slug: `${thinPage!.category.slug}-cost` })),
  ],
];

describe("K7: every page route is classified for the AdSense loader", () => {
  it("finds the page routes", () => {
    expect(PAGE_FILES.length).toBeGreaterThanOrEqual(16);
  });

  it("each src/app page.tsx is in exactly one of the include and exclude tables", () => {
    const unclassified = PAGE_FILES.map(routeOf).filter(
      (r) => !INCLUDE_ROUTES.includes(r) && !EXCLUDE_ROUTES.includes(r),
    );
    expect(unclassified).toEqual([]);
    expect(INCLUDE_ROUTES.filter((r) => EXCLUDE_ROUTES.includes(r))).toEqual([]);
    const routes = PAGE_FILES.map(routeOf);
    for (const r of [...INCLUDE_ROUTES, ...EXCLUDE_ROUTES]) expect(routes, r).toContain(r);
  });

  it("no page or route-level layout mounts the loader; the route gate decides (see ad-eligibility-parity)", () => {
    for (const file of PAGE_FILES) {
      const layout = join(dirname(file), "layout.tsx");
      const routeLayout = existsSync(layout) && dirname(file) !== APP_DIR ? read(layout) : "";
      expect(read(file) + routeLayout, routeOf(file)).not.toMatch(/AdsenseLoader|adsense-loader|adsbygoogle/);
    }
  });

  it("not-found and error never render the loader", () => {
    for (const file of ["not-found.tsx", "error.tsx"]) {
      expect(read(join(APP_DIR, file)), file).not.toMatch(/AdsenseLoader|id="adsense-loader"|adsbygoogle\.js/);
    }
  });

  it("only the root layout renders the loader, in <head> after the Consent Mode defaults script", () => {
    const users = walk(join(ROOT, "src"))
      .filter((f) => /\.(tsx|ts)$/.test(f))
      .filter((f) => /<AdsenseLoader\b/.test(read(f)))
      .map((f) => relative(join(ROOT, "src"), f).split(sep).join("/"));
    expect(users).toEqual(["app/layout.tsx"]);
    const layout = read(join(APP_DIR, "layout.tsx"));
    const defaultsAt = layout.indexOf('id="consent-mode-defaults"');
    const loaderAt = layout.indexOf("<AdsenseLoader");
    expect(defaultsAt).toBeGreaterThan(layout.indexOf("<head>"));
    expect(loaderAt).toBeGreaterThan(defaultsAt);
    expect(loaderAt).toBeLessThan(layout.indexOf("</head>"));
  });
});

describe("K7: rendered output (RootLayout composed with each page)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-2222222222222222");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.doUnmock("@/data/index-policy.json");
    vi.resetModules();
  });

  it.each(INCLUDED)("%s renders exactly one loader, inside <head> after the Consent Mode defaults", async (path, page) => {
    const html = await inLayout(path, page());
    expect(loaderCount(html)).toBe(1);
    expect(html).toContain("adsbygoogle.js?client=ca-pub-2222222222222222");
    const defaultsAt = html.indexOf('id="consent-mode-defaults"');
    expect(defaultsAt).toBeGreaterThan(-1);
    expect(defaultsAt).toBeLessThan(html.indexOf(PRESENT));
    expect(html.indexOf(PRESENT)).toBeLessThan(html.indexOf("</head>"));
  });

  it.each(EXCLUDED)("%s renders no loader", async (_label, path, page) => {
    const html = await inLayout(path, page());
    expect(html).not.toContain("adsbygoogle.js");
    expect(html).not.toContain('id="adsense-loader"');
  });

  it("the loader stays after the Consent Mode defaults inside <head> (the onLoad prop keeps React from hoisting it)", async () => {
    const html = await inLayout("/", HomePage());
    const head = html.slice(html.indexOf("<head"), html.indexOf("</head>"));
    expect(head.indexOf('id="consent-mode-defaults"')).toBeGreaterThan(-1);
    expect(head.indexOf("adsbygoogle.js")).toBeGreaterThan(head.indexOf('id="consent-mode-defaults"'));
    expect(html.slice(html.indexOf("<body"))).not.toContain("adsbygoogle.js");
  });

  it("an indexable instance renders the loader and an instance outside an injected keep list does not", async () => {
    const unique = PAGE_INDEX.filter((p) => p.hasUniqueData);
    const [kept, dropped] = [unique[0], unique[1]];
    vi.resetModules();
    vi.doMock("@/data/index-policy.json", () => ({
      default: { keep: [kept.path], noindex: [], exceptions: [] },
    }));
    const [{ default: Layout }, { default: Slug }] = await Promise.all([
      import("@/app/layout"),
      import("@/app/[state]/[slug]/page"),
    ]);
    const render = async (p: typeof kept) => {
      setPathname(p.path);
      const element = await Slug(params({ state: p.state.slug, slug: `${p.category.slug}-cost` }));
      return renderToStaticMarkup(createElement(Layout, null, element));
    };
    expect(loaderCount(await render(kept))).toBe(1);
    expect(loaderCount(await render(dropped))).toBe(0);
  });
});
