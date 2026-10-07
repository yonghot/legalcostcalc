import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { setPathname } from "./helpers/render";
import RootLayout from "@/app/layout";
import HomePage from "@/app/page";
import StateHubPage from "@/app/[state]/page";
import StateCategoryPage, { generateMetadata } from "@/app/[state]/[slug]/page";
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
import EmbedCalculatorPage from "@/app/embed/[state]/[slug]/page";
import NotFound from "@/app/not-found";
import { isIndexable } from "@/lib/index-policy";
import { PAGE_INDEX } from "@/lib/page-index";

interface Violation {
  check: string;
  page: string;
  detail: string;
}
interface ScanResult {
  ok: boolean;
  stats: Record<string, number>;
  violations: Violation[];
}
interface Expect {
  templates: number;
  stateHubs: number;
  categoryHubs: number;
}
interface ScanModule {
  scanBuiltHtml(options: { appDir: string; expect?: Expect }): ScanResult;
  DEFAULT_EXPECT: Expect;
  MIN_SAMPLE_MAIN_WORDS: number;
}

const scriptPath = path.join(__dirname, "..", "..", "scripts", "scan-built-html.mjs");
const loadScan = async (): Promise<ScanModule> =>
  (await import(/* @vite-ignore */ pathToFileURL(scriptPath).href)) as ScanModule;

const ORIGIN = "https://legalcostcalc.co";
const params = <T,>(value: T) => ({ params: Promise.resolve(value) });

const KEPT_TEMPLATES = ["california/divorce-cost", "new-york/divorce-cost", "massachusetts/bankruptcy-cost"];
const NOINDEXED_TEMPLATES = ["texas/divorce-cost", "ohio/estate-planning-cost"];
const STATE_HUBS = ["california", "new-york", "massachusetts", "texas", "ohio"];
const CATEGORY_HUBS = ["divorce", "bankruptcy", "estate-planning"];
const EXPECT: Expect = { templates: 5, stateHubs: 5, categoryHubs: 3 };

type Factory = () => ReactNode | Promise<ReactNode>;
const slugOf = (template: string) => {
  const [state, slug] = template.split("/");
  return { state: state!, slug: slug! };
};

const PAGES: Array<[string, string, Factory]> = [
  ["index", "/", () => HomePage()],
  ["about", "/about", () => AboutPage()],
  ["privacy", "/privacy", () => PrivacyPage()],
  ["terms", "/terms", () => TermsPage()],
  ["contact", "/contact", () => ContactPage()],
  ["embed", "/embed", () => EmbedIndexPage()],
  ["how-legal-fees-work", "/how-legal-fees-work", () => GuidePage()],
  ["settlement-estimator", "/settlement-estimator", () => SettlementEstimatorPage()],
  ["divorce-cost-by-state", "/divorce-cost-by-state", () => DivorceHubPage()],
  ["legal-cost-statistics", "/legal-cost-statistics", () => StatisticsPage()],
  ["compare", "/compare", () => createElement(CompareLayout, null, createElement(ComparePage))],
  ...STATE_HUBS.map((s): [string, string, Factory] => [s, `/${s}`, () => StateHubPage(params({ state: s }))]),
  ...CATEGORY_HUBS.map((c): [string, string, Factory] => [
    `category/${c}`,
    `/category/${c}`,
    () => CategoryHubPage(params({ category: c })),
  ]),
  ...[...KEPT_TEMPLATES, ...NOINDEXED_TEMPLATES].map((t): [string, string, Factory] => [
    t,
    `/${t}`,
    () => StateCategoryPage(params(slugOf(t))),
  ]),
];

async function document(route: string, element: ReactNode | Promise<ReactNode>, head: string): Promise<string> {
  setPathname(route);
  const html = renderToStaticMarkup(createElement(RootLayout, null, await element));
  return `<!DOCTYPE html>${html.replace("</head>", `${head}</head>`)}`;
}

const canonical = (route: string) => `<link rel="canonical" href="${ORIGIN}${route === "/" ? "/" : route}"/>`;

// What next build (18bf560) actually emits: embed frames carry no canonical; the 404 page gets Next's own noindex beside the layout's tag.
const EMBED_ROBOTS = `<meta name="robots" content="noindex, nofollow, max-image-preview:large"/>`;
const NOT_FOUND_ROBOTS = `<meta name="robots" content="noindex"/><meta name="robots" content="index, follow, max-image-preview:large"/>`;

async function robotsTag(template: string): Promise<string> {
  const meta = await generateMetadata(params(slugOf(template)));
  const robots = meta.robots as { index?: boolean; follow?: boolean } | undefined;
  if (!robots) return "";
  return `<meta name="robots" content="${robots.index === false ? "noindex" : "index"}, ${robots.follow === false ? "nofollow" : "follow"}"/>`;
}

function write(dir: string, rel: string, content: string): void {
  const file = path.join(dir, rel);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, content);
}

let root = "";
let good = "";

beforeAll(async () => {
  root = mkdtempSync(path.join(tmpdir(), "scan-built-html-"));
  good = path.join(root, "good");
  const sitemapRoutes: string[] = [];
  for (const [rel, route, factory] of PAGES) {
    const template = [...KEPT_TEMPLATES, ...NOINDEXED_TEMPLATES].includes(rel);
    const head = canonical(route) + (template ? await robotsTag(rel) : "");
    write(good, `${rel}.html`, await document(route, factory(), head));
    if (!template) sitemapRoutes.push(route);
    else {
      const pair = PAGE_INDEX.find((p) => p.path === route)!;
      if (isIndexable(pair.state.code, pair.category.slug)) sitemapRoutes.push(route);
    }
  }
  const embedRoute = "/embed/california/divorce-cost";
  write(
    good,
    "embed/california/divorce-cost.html",
    await document(embedRoute, EmbedCalculatorPage(params({ state: "california", slug: "divorce-cost" })), EMBED_ROBOTS),
  );
  write(good, "_not-found.html", await document("/texas/not-a-real-cost", NotFound(), NOT_FOUND_ROBOTS));
  const urls = sitemapRoutes.map((r) => `<url><loc>${ORIGIN}${r === "/" ? "" : r}</loc></url>`).join("");
  write(good, "sitemap.xml.body", `<?xml version="1.0" encoding="UTF-8"?><urlset>${urls}</urlset>`);
});

afterAll(() => {
  if (root) rmSync(root, { recursive: true, force: true });
});

function mutated(change: (dir: string) => void, expect: Expect = EXPECT): Promise<ScanResult> {
  const dir = mkdtempSync(path.join(root, "m-"));
  cpSync(good, dir, { recursive: true });
  change(dir);
  return loadScan().then((m) => m.scanBuiltHtml({ appDir: dir, expect }));
}

function edit(dir: string, rel: string, change: (html: string) => string): void {
  const file = path.join(dir, rel);
  writeFileSync(file, change(readFileSync(file, "utf8")));
}

const LOADER = '<div hidden><script id="adsense-loader" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1"></script></div>';
const hit = (result: ScanResult, check: string, page: string) =>
  result.violations.some((v) => v.check === check && v.page === page);

describe("scan-built-html: the real render of the fixed code passes", () => {
  it("scans the rendered pages with zero violations and the expected K8 split", async () => {
    const { scanBuiltHtml } = await loadScan();
    const result = scanBuiltHtml({ appDir: good, expect: EXPECT });
    expect(result.violations).toEqual([]);
    expect(result.ok).toBe(true);
    expect(result.stats).toMatchObject({
      templates: 5,
      templatesInSitemap: 3,
      templatesWithLoader: 3,
      templatesNoindex: 2,
      stateHubs: 5,
      categoryHubs: 3,
      embedFrames: 1,
    });
  });

  it("measures the main-content words of the sampled templates above the floor, without the page chrome", async () => {
    const { scanBuiltHtml, MIN_SAMPLE_MAIN_WORDS } = await loadScan();
    const { stats } = scanBuiltHtml({ appDir: good, expect: EXPECT });
    for (const route of ["/california/divorce-cost", "/new-york/divorce-cost", "/massachusetts/bankruptcy-cost"]) {
      expect(stats[`words:${route}`], route).toBeGreaterThanOrEqual(MIN_SAMPLE_MAIN_WORDS);
    }
  });

  it("the default expectations are the 408 matter pages, 51 state hubs and 8 category hubs", async () => {
    const { DEFAULT_EXPECT } = await loadScan();
    expect(DEFAULT_EXPECT).toEqual({ templates: 408, stateHubs: 51, categoryHubs: 8 });
  });
});

describe("scan-built-html: positive controls (each defect is caught)", () => {
  it("an empty or missing directory fails instead of passing vacuously", async () => {
    const { scanBuiltHtml } = await loadScan();
    expect(scanBuiltHtml({ appDir: path.join(root, "nowhere") }).ok).toBe(false);
    expect(existsSync(path.join(root, "nowhere"))).toBe(false);
  });

  it("a loader on a noindexed template", async () => {
    const r = await mutated((d) => edit(d, "texas/divorce-cost.html", (h) => h.replace("</body>", `${LOADER}</body>`)));
    expect(hit(r, "loader", "/texas/divorce-cost")).toBe(true);
  });

  it("a kept template without its loader", async () => {
    const r = await mutated((d) =>
      edit(d, "california/divorce-cost.html", (h) => h.replace(/<div hidden(?:="")?><script id="adsense-loader"[\s\S]*?<\/script><\/div>/, "")),
    );
    expect(hit(r, "loader", "/california/divorce-cost")).toBe(true);
  });

  it("a loader inside an embed frame", async () => {
    const r = await mutated((d) => edit(d, "embed/california/divorce-cost.html", (h) => h.replace("</body>", `${LOADER}</body>`)));
    expect(hit(r, "loader", "/embed/california/divorce-cost")).toBe(true);
  });

  it("a canonical link on an embed frame (noindex plus a cross-URL canonical is a conflicting signal)", async () => {
    const r = await mutated((d) =>
      edit(d, "embed/california/divorce-cost.html", (h) => h.replace("</head>", `${canonical("/california/divorce-cost")}</head>`)),
    );
    expect(hit(r, "canonical", "/embed/california/divorce-cost")).toBe(true);
  });

  it("an embed frame that is not noindex,nofollow", async () => {
    const r = await mutated((d) => edit(d, "embed/california/divorce-cost.html", (h) => h.replace(EMBED_ROBOTS, "")));
    expect(hit(r, "robots", "/embed/california/divorce-cost")).toBe(true);
  });

  it("a 404 page without noindex", async () => {
    const r = await mutated((d) => edit(d, "_not-found.html", (h) => h.replace('<meta name="robots" content="noindex"/>', "")));
    expect(hit(r, "robots", "/_not-found")).toBe(true);
  });

  it("a loader on the 404 page", async () => {
    const r = await mutated((d) => edit(d, "_not-found.html", (h) => h.replace("</body>", `${LOADER}</body>`)));
    expect(hit(r, "loader", "/_not-found")).toBe(true);
  });

  it("Consent Mode defaults missing ahead of the loader", async () => {
    const r = await mutated((d) => edit(d, "about.html", (h) => h.replace('id="consent-mode-defaults"', 'id="renamed"')));
    expect(hit(r, "consent-order", "/about")).toBe(true);
  });

  it("the loader hoisted into <head>", async () => {
    const r = await mutated((d) =>
      edit(d, "about.html", (h) => h.replace("</head>", `<script id="adsense-loader" async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=x"></script></head>`)),
    );
    expect(hit(r, "consent-order", "/about") || hit(r, "loader", "/about")).toBe(true);
  });

  it("a hidden Suspense segment", async () => {
    const r = await mutated((d) => edit(d, "about.html", (h) => h.replace("</body>", '<div hidden id="S:0"><p>late content</p></div></body>')));
    expect(hit(r, "hidden-segment", "/about")).toBe(true);
  });

  it.each([
    ["coming soon", "<p>Pro plans coming soon</p>"],
    ["reviewer pending", "<p>Reviewed for accuracy (legal reviewer pending)</p>"],
    ["developer speak", "<p>Set NEXT_PUBLIC_ADSENSE_CLIENT_ID to enable ads</p>"],
    ["broken prose", "<p>Costs from $-5 to undefined</p>"],
  ])("visible %s text", async (_name, markup) => {
    const r = await mutated((d) => edit(d, "terms.html", (h) => h.replace("</body>", `${markup}</body>`)));
    expect(hit(r, "placeholder", "/terms")).toBe(true);
  });

  it("the same words inside a script are not visible text", async () => {
    const r = await mutated((d) => edit(d, "terms.html", (h) => h.replace("</body>", "<script>var s='coming soon NEXT_PUBLIC_X'</script></body>")));
    expect(r.violations).toEqual([]);
  });

  it("two canonical links", async () => {
    const r = await mutated((d) => edit(d, "privacy.html", (h) => h.replace("</head>", `${canonical("/elsewhere")}</head>`)));
    expect(hit(r, "canonical", "/privacy")).toBe(true);
  });

  it("a canonical that points at another page", async () => {
    const r = await mutated((d) => edit(d, "privacy.html", (h) => h.replace(`${ORIGIN}/privacy`, `${ORIGIN}/terms`)));
    expect(hit(r, "canonical", "/privacy")).toBe(true);
  });

  it("no canonical at all", async () => {
    const r = await mutated((d) => edit(d, "privacy.html", (h) => h.replace(canonical("/privacy"), "")));
    expect(hit(r, "canonical", "/privacy")).toBe(true);
  });

  it("conflicting robots tokens", async () => {
    const r = await mutated((d) => edit(d, "about.html", (h) => h.replace("</head>", '<meta name="robots" content="index, noindex"/></head>')));
    expect(hit(r, "robots", "/about")).toBe(true);
  });

  it("a sitemap page marked noindex", async () => {
    const r = await mutated((d) => edit(d, "california/divorce-cost.html", (h) => h.replace("</head>", '<meta name="robots" content="noindex, follow"/></head>')));
    expect(hit(r, "robots", "/california/divorce-cost")).toBe(true);
    expect(hit(r, "loader", "/california/divorce-cost")).toBe(true);
  });

  it("a page left out of the sitemap but still indexable", async () => {
    const r = await mutated((d) => edit(d, "texas/divorce-cost.html", (h) => h.replace(/<meta name="robots"[^>]*>/, "")));
    expect(hit(r, "robots", "/texas/divorce-cost")).toBe(true);
  });

  it("a route prerendered for an unknown state", async () => {
    const r = await mutated((d) => write(d, "atlantis/divorce-cost.html", readFileSync(path.join(d, "texas", "divorce-cost.html"), "utf8")));
    expect(hit(r, "unknown-params", "/atlantis/divorce-cost")).toBe(true);
  });

  it("a route prerendered for an unknown matter", async () => {
    const r = await mutated((d) => write(d, "texas/astrology-cost.html", readFileSync(path.join(d, "texas", "divorce-cost.html"), "utf8")));
    expect(hit(r, "unknown-params", "/texas/astrology-cost")).toBe(true);
  });

  it("a sitemap URL with no prerendered page", async () => {
    const r = await mutated((d) => edit(d, "sitemap.xml.body", (x) => x.replace("</urlset>", `<url><loc>${ORIGIN}/ohio/dui-cost</loc></url></urlset>`)));
    expect(hit(r, "sitemap", "/ohio/dui-cost")).toBe(true);
  });

  it("a missing sitemap", async () => {
    const r = await mutated((d) => rmSync(path.join(d, "sitemap.xml.body")));
    expect(r.violations.some((v) => v.check === "sitemap")).toBe(true);
  });

  it("a different page count than expected", async () => {
    const r = await mutated(() => {}, { ...EXPECT, templates: 6 });
    expect(hit(r, "count", "templates")).toBe(true);
  });

  it("a thin sampled template", async () => {
    const r = await mutated((d) => edit(d, "california/divorce-cost.html", (h) => h.replace(/<main\b[\s\S]*<\/main>/, "<main><h1>Divorce cost</h1><p>Short.</p></main>")));
    expect(hit(r, "words", "/california/divorce-cost")).toBe(true);
  });

  it("an unclassified page file", async () => {
    const r = await mutated((d) => write(d, "admin/secret/page.html", "<html></html>"));
    expect(r.violations.some((v) => v.check === "unknown-params")).toBe(true);
  });
});
