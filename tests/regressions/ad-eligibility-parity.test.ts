import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { setPathname } from "./helpers/render";
import RootLayout from "@/app/layout";
import { isAdEligiblePath } from "@/lib/ad-eligibility";
import { buildAdEligibilityRules } from "@/lib/ad-eligibility-rules";
import { INDEXED_PAGES, isIndexable } from "@/lib/index-policy";
import { PAGE_INDEX } from "@/lib/page-index";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

/*
 * R4: the AdSense loader moved from fourteen per-page mounts into one client component in the root layout <head>.
 * The route set must not change. LOADER_BEFORE restates what the per-page mounts did: the ten fixed content pages and
 * the home page, every state hub, every category hub, and a state x matter template only when isIndexable() was true
 * (the old `indexable && <AdsenseLoader />`). Embed frames, /search, 404 and error never had one.
 */

const APP_DIR = join(__dirname, "..", "..", "src", "app");

const FIXED_PAGES_WITH_LOADER = [
  "/",
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

function loaderBefore(path: string): boolean {
  if (FIXED_PAGES_WITH_LOADER.includes(path)) return true;
  const seg = path.split("/").filter(Boolean);
  if (path !== `/${seg.join("/")}`) return false;
  if (seg.length === 1) return STATES.some((s) => s.slug === seg[0]);
  if (seg.length === 2 && seg[0] === "category") return CATEGORIES.some((c) => c.slug === seg[1]);
  if (seg.length === 2) {
    const state = STATES.find((s) => s.slug === seg[0]);
    const category = CATEGORIES.find((c) => `${c.slug}-cost` === seg[1]);
    return Boolean(state && category && isIndexable(state.code, category.slug));
  }
  return false;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const routeOf = (file: string) => "/" + relative(APP_DIR, dirname(file)).split(sep).filter(Boolean).join("/");
const PAGE_ROUTES = walk(APP_DIR)
  .filter((f) => /[\\/]page\.tsx$/.test(f))
  .map(routeOf);

function concrete(route: string): string[] {
  switch (route) {
    case "/[state]":
      return STATES.map((s) => `/${s.slug}`);
    case "/category/[category]":
      return CATEGORIES.map((c) => `/category/${c.slug}`);
    case "/[state]/[slug]":
      return STATES.flatMap((s) => CATEGORIES.map((c) => `/${s.slug}/${c.slug}-cost`));
    case "/embed/[state]/[slug]":
      return STATES.flatMap((s) => CATEGORIES.map((c) => `/embed/${s.slug}/${c.slug}-cost`));
    default:
      expect(route, "a page route with an unexpanded dynamic segment").not.toMatch(/\[/);
      return [route];
  }
}

const EXTRA_PATHS = [
  "/_not-found",
  "/404",
  "/search",
  "/not-a-state",
  "/category",
  "/category/not-a-category",
  "/california/not-a-matter-cost",
  "/california/divorce",
  "/california/divorce-cost/",
  "/california/",
  "/embed/california",
  "/embed/california/divorce-cost/extra",
  "/legal-cost-statistics/data.json",
  "/legal-cost-statistics/data.csv",
  "/sitemap.xml",
  "/api/costs",
  "/CALIFORNIA/divorce-cost",
];

const ALL_PATHS = [...new Set([...PAGE_ROUTES.flatMap(concrete), ...EXTRA_PATHS])];

describe("ad eligibility: the route gate keeps exactly the routes the per-page mounts had", () => {
  const rules = buildAdEligibilityRules();

  it("enumerates every route class", () => {
    expect(PAGE_ROUTES).toEqual(expect.arrayContaining(["/", "/[state]", "/[state]/[slug]", "/category/[category]", "/embed/[state]/[slug]", "/search"]));
    expect(STATES.length).toBe(51);
    expect(CATEGORIES.length).toBe(8);
    expect(PAGE_INDEX.length).toBe(408);
    expect(ALL_PATHS.length).toBeGreaterThan(900);
  });

  it("isAdEligiblePath agrees with the old per-page rule on every path", () => {
    const wrong = ALL_PATHS.filter((p) => isAdEligiblePath(p, rules) !== loaderBefore(p));
    expect(wrong).toEqual([]);
  });

  it("the eligible set is 11 fixed pages + 51 state hubs + 8 category hubs + the indexed templates", () => {
    const eligible = ALL_PATHS.filter((p) => isAdEligiblePath(p, rules));
    const indexedPaths = PAGE_INDEX.filter((p) => isIndexable(p.state.code, p.category.slug)).map((p) => p.path);
    expect(indexedPaths.sort()).toEqual(INDEXED_PAGES.map((p) => p.path).sort());
    expect(eligible.length).toBe(FIXED_PAGES_WITH_LOADER.length + STATES.length + CATEGORIES.length + indexedPaths.length);
    expect(rules.templates.length).toBe(indexedPaths.length);
  });

  it("no embed frame, noindex template, search, 404 or data feed is eligible", () => {
    const embed = ALL_PATHS.filter((p) => p.startsWith("/embed/"));
    expect(embed.length).toBeGreaterThanOrEqual(408);
    const noindex = PAGE_INDEX.filter((p) => !isIndexable(p.state.code, p.category.slug)).map((p) => p.path);
    expect(noindex.length).toBeGreaterThan(300);
    for (const p of [...embed, ...noindex, "/search", "/_not-found", "/404", "/legal-cost-statistics/data.json", "/california/divorce-cost/"]) {
      expect(isAdEligiblePath(p, rules), p).toBe(false);
    }
  });

  it("the rule set is plain serializable data a server component can pass to the client loader", () => {
    expect(JSON.parse(JSON.stringify(rules))).toEqual(rules);
    expect(JSON.stringify(rules).length).toBeLessThan(8000);
  });

  it("rendered root layouts carry the loader in <head> exactly for the eligible paths", () => {
    const wrong: string[] = [];
    let withLoader = 0;
    const rendered = ALL_PATHS.filter((p, i) => loaderBefore(p) || EXTRA_PATHS.includes(p) || i % 8 === 0);
    expect(rendered.length).toBeGreaterThan(200);
    for (const path of rendered) {
      setPathname(path);
      const html = renderToStaticMarkup(createElement(RootLayout, null, null));
      const head = html.slice(html.indexOf("<head"), html.indexOf("</head>"));
      const count = head.split('id="adsense-loader"').length - 1;
      const libraries = html.split("adsbygoogle.js").length - 1;
      const want = loaderBefore(path) ? 1 : 0;
      if (count !== want || libraries !== want) wrong.push(`${path}: loaders ${count}, adsbygoogle.js x${libraries}, want ${want}`);
      if (want === 1) {
        withLoader += 1;
        if (head.indexOf('id="adsense-loader"') < head.indexOf('id="consent-mode-defaults"')) wrong.push(`${path}: loader before the Consent Mode defaults`);
      }
    }
    expect(wrong).toEqual([]);
    expect(withLoader).toBe(FIXED_PAGES_WITH_LOADER.length + STATES.length + CATEGORIES.length + INDEXED_PAGES.length);
  });
});
