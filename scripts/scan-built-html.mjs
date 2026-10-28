#!/usr/bin/env node
// Post-build scan of the prerendered HTML in .next/server/app: the built-output counterpart of the
// K1/K2/K3/K7/K8/K12/K14 unit tests. Usage: node scripts/scan-built-html.mjs [--dir <app dir>] [--json]
// It only reads files; it never starts a server and never touches the network.

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "..");

export const DEFAULT_EXPECT = { templates: 408, stateHubs: 51, categoryHubs: 8 };

export const LOADER_PAGES = [
  "compare",
  "divorce-cost-by-state",
  "legal-cost-statistics",
  "how-legal-fees-work",
  "about",
  "contact",
  "privacy",
  "terms",
  "embed",
  "settlement-estimator",
];

export const SAMPLE_TEMPLATES = ["/california/divorce-cost", "/new-york/divorce-cost", "/massachusetts/bankruptcy-cost"];

export const MIN_SAMPLE_MAIN_WORDS = 1500;

const FORBIDDEN = {
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
  "developer speak": /NEXT_PUBLIC_\w+|process\.env|\b[\w-]+\.(?:tsx?|mjs)\b|not streamed|bundled dataset|this site's configuration/i,
  "broken prose": /\bundefined\b|\bNaN\b|\[object|\$-\d/,
};

const HIDDEN_SEGMENT = /<div hidden(?:="")? id="S:\d+"/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function visibleText(html) {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
}

// Next/SWC drops the leading space of JSX text after {expr} or a closing tag in some shapes; the built HTML then shows a comment marker or a closing inline tag glued to the next word.
const GLUE_MARKUP_RULES = [
  /[A-Za-z0-9.,)]{2,}(?:<!-- -->|<\/(?:em|strong|a|span|b|i|code)>)[a-z(]/g,
  /[.!?:;)]<\/(?:em|strong|b|i|code|a)>[A-Za-z0-9(]/g,
];
const JOINED_WORDS = /\b(?:afteryou|onlyafter|Consentlink|notsell|(?:uncontested|contested)figure)\b|[a-z]by tier, against each tier|[a-z]court's own schedule/g;

export function findGlue(html) {
  const markup = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "");
  const around = (text, at, len) => text.slice(Math.max(0, at - 30), at + len + 30).replace(/\s+/g, " ");
  const hits = [];
  for (const rule of GLUE_MARKUP_RULES) {
    for (const m of markup.matchAll(rule)) hits.push(around(markup, m.index ?? 0, m[0].length));
  }
  const tight = markup
    .replace(/<!-- -->/g, "")
    .replace(/<\/?(?:em|strong|a|span|b|i|code|small|sup|sub|mark)\b[^>]*>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ");
  for (const m of tight.matchAll(JOINED_WORDS)) hits.push(around(tight, m.index ?? 0, m[0].length));
  return hits;
}

const wordCount = (text) => text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;

function attr(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]*)"`, "i"));
  return match ? match[1] : null;
}

function tagsOf(html, tagName, key, value) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))]
    .map((m) => m[0])
    .filter((tag) => (attr(tag, key) ?? "").toLowerCase() === value);
}

const pathOf = (url) => {
  try {
    const p = new URL(url, "https://placeholder.invalid").pathname;
    return p.length > 1 ? p.replace(/\/$/, "") : p;
  } catch {
    return url;
  }
};

export function classify(rel, hubNames) {
  const parts = rel.split("/");
  if (rel === "index") return { kind: "home", route: "/", include: true };
  if (parts.length === 1) {
    if (parts[0] === "_not-found" || parts[0] === "_global-error" || parts[0] === "404") {
      return { kind: "error", route: `/${parts[0]}`, include: false };
    }
    if (LOADER_PAGES.includes(parts[0])) return { kind: "page", route: `/${parts[0]}`, include: true };
    return { kind: "state-hub", route: `/${parts[0]}`, include: true };
  }
  if (parts.length === 2 && parts[0] === "category") {
    return { kind: "category-hub", route: `/${rel}`, include: true };
  }
  if (parts.length === 2 && parts[1].endsWith("-cost")) {
    return { kind: "template", route: `/${rel}`, include: true, state: parts[0], category: parts[1].slice(0, -"-cost".length) };
  }
  if (parts.length === 3 && parts[0] === "embed" && parts[2].endsWith("-cost")) {
    return { kind: "embed-frame", route: `/${rel}`, include: false, state: parts[1], category: parts[2].slice(0, -"-cost".length) };
  }
  return { kind: "unclassified", route: `/${rel}`, include: false, hubNames };
}

function findSitemap(appDir) {
  return ["sitemap.xml.body", "sitemap.xml", path.join("sitemap", "route.xml.body")]
    .map((rel) => path.join(appDir, rel))
    .find((file) => existsSync(file));
}

export function scanBuiltHtml({ appDir, expect = DEFAULT_EXPECT, samples = SAMPLE_TEMPLATES, minSampleWords = MIN_SAMPLE_MAIN_WORDS }) {
  const violations = [];
  const add = (check, page, detail) => violations.push({ check, page, detail });

  const htmlFiles = existsSync(appDir) ? walk(appDir).filter((f) => f.endsWith(".html")) : [];
  if (htmlFiles.length === 0) {
    add("input", appDir, "no prerendered .html files found; run `next build` first");
    return { ok: false, stats: {}, violations };
  }

  const pages = htmlFiles.map((file) => {
    const rel = path.relative(appDir, file).split(path.sep).join("/").replace(/\.html$/, "");
    return { rel, file, html: readFileSync(file, "utf8") };
  });

  const stateHubs = new Set(
    pages.filter((p) => !p.rel.includes("/") && p.rel !== "index" && !p.rel.startsWith("_") && !LOADER_PAGES.includes(p.rel)).map((p) => p.rel),
  );
  const categoryHubs = new Set(pages.filter((p) => p.rel.startsWith("category/")).map((p) => p.rel.slice("category/".length)));

  const sitemapFile = findSitemap(appDir);
  const sitemapPaths = new Set();
  if (!sitemapFile) {
    add("sitemap", "sitemap.xml.body", "built sitemap not found next to the prerendered pages");
  } else {
    for (const m of readFileSync(sitemapFile, "utf8").matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)) sitemapPaths.add(pathOf(m[1]));
  }

  const stats = { pages: pages.length, pagesWithLoader: 0, templates: 0, templatesInSitemap: 0, templatesWithLoader: 0, templatesNoindex: 0, stateHubs: stateHubs.size, categoryHubs: categoryHubs.size, embedFrames: 0 };
  const pageByRoute = new Map();

  for (const page of pages) {
    const info = classify(page.rel, { stateHubs, categoryHubs });
    page.info = info;
    pageByRoute.set(info.route, page);
    const route = info.route;
    const { html } = page;

    if (info.kind === "unclassified") {
      add("unknown-params", route, "page file does not belong to any known route class");
      continue;
    }

    if (info.kind === "template") {
      stats.templates += 1;
      if (!stateHubs.has(info.state) || !categoryHubs.has(info.category)) {
        add("unknown-params", route, `a page was prerendered for state "${info.state}" / matter "${info.category}", which has no hub`);
      }
      if (/NEXT_HTTP_ERROR_FALLBACK;404|<title>404/.test(html)) {
        add("unknown-params", route, "prerendered file is a 404 stub");
      }
    }
    if (info.kind === "embed-frame") stats.embedFrames += 1;

    const loaderCount = (html.match(/id="adsense-loader"/g) ?? []).length;
    const libCount = (html.match(/adsbygoogle\.js/g) ?? []).length;
    const inSitemap = sitemapPaths.has(route);
    const robotsTags = tagsOf(html, "meta", "name", "robots");
    const robotsContent = robotsTags.map((t) => (attr(t, "content") ?? "").toLowerCase());
    const tokens = robotsContent.flatMap((c) => c.split(",").map((t) => t.trim()));
    const noindex = tokens.includes("noindex");

    let wantLoader;
    if (info.kind === "template") {
      if (inSitemap) stats.templatesInSitemap += 1;
      if (noindex) stats.templatesNoindex += 1;
      wantLoader = inSitemap && !noindex ? 1 : 0;
    } else {
      wantLoader = info.include ? 1 : 0;
    }
    if (loaderCount > 0 && info.kind === "template") stats.templatesWithLoader += 1;
    if (loaderCount !== wantLoader || (wantLoader === 0 && libCount > 0)) {
      add("loader", route, `expected ${wantLoader} loader(s), found ${loaderCount} (adsbygoogle.js x${libCount})`);
    }

    if (loaderCount > 0) stats.pagesWithLoader += 1;
    if (loaderCount > 0) {
      const defaultsAt = html.indexOf('id="consent-mode-defaults"');
      const loaderAt = html.indexOf('id="adsense-loader"');
      const headEnd = html.indexOf("</head>");
      if (defaultsAt < 0 || defaultsAt > loaderAt) add("consent-order", route, "Consent Mode defaults are missing or come after the loader");
      if (headEnd < 0 || loaderAt > headEnd) add("consent-order", route, "the loader is outside <head>; it must follow the Consent Mode defaults inside <head>");
      const loaderTag = html.slice(html.lastIndexOf("<", loaderAt), html.indexOf(">", loaderAt) + 1);
      if (!/^<script\b/.test(loaderTag) || !/\basync\b/.test(loaderTag) || !/\bsrc="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-\d+"/.test(loaderTag)) {
        add("loader", route, `the loader tag is not an async adsbygoogle.js script: ${loaderTag.slice(0, 120)}`);
      }
    }

    const glue = findGlue(html);
    for (const hitText of glue.slice(0, 6)) add("glue", route, `words joined without a space: "${hitText}"`);

    const hidden = (html.match(HIDDEN_SEGMENT) ?? []).length;
    if (hidden > 0) add("hidden-segment", route, `${hidden} hidden Suspense segment(s) (<div hidden id="S:n">) hold content out of the visible tree`);

    const text = visibleText(html);
    for (const [name, pattern] of Object.entries(FORBIDDEN)) {
      const hit = text.match(pattern);
      if (hit) {
        const at = hit.index ?? 0;
        add("placeholder", route, `${name}: "${text.slice(Math.max(0, at - 30), at + 50)}"`);
      }
    }

    // Embed frames are noindex,nofollow; a canonical to another URL on a noindexed page sends Google conflicting signals.
    if (info.kind === "embed-frame") {
      const canonicals = tagsOf(html, "link", "rel", "canonical");
      if (canonicals.length !== 0) add("canonical", route, `an embed frame carries ${canonicals.length} canonical link(s); it must carry none`);
      if (!(noindex && tokens.includes("nofollow"))) add("robots", route, "an embed frame is not marked noindex,nofollow");
    } else if (info.kind !== "error") {
      const canonicals = tagsOf(html, "link", "rel", "canonical");
      if (canonicals.length !== 1) {
        add("canonical", route, `expected exactly one canonical link, found ${canonicals.length}`);
      } else {
        const href = pathOf(attr(canonicals[0], "href") ?? "");
        if (href !== route) add("canonical", route, `canonical points to ${href}, expected ${route}`);
      }
    }

    // Next injects its own <meta name="robots" content="noindex"> into the 404 page next to the layout's tag; the page is served with status 404.
    if (route === "/_not-found" || route === "/404") {
      if (!noindex) add("robots", route, "the 404 page is not marked noindex");
    } else {
      if (robotsTags.length > 1) add("robots", route, `${robotsTags.length} robots meta tags`);
      if (tokens.includes("index") && tokens.includes("noindex")) add("robots", route, `robots tokens conflict: ${robotsContent.join(" | ")}`);
    }
    if (info.kind === "template") {
      if (inSitemap && noindex) add("robots", route, "listed in the sitemap but marked noindex");
      if (!inSitemap && !(noindex && tokens.includes("follow"))) add("robots", route, "left out of the sitemap but not marked noindex,follow");
    } else if (info.include && noindex) {
      add("robots", route, "an included page is marked noindex");
    }
  }

  for (const route of sitemapPaths) {
    if (route !== "/" && !pageByRoute.has(route)) add("sitemap", route, "listed in the sitemap but not prerendered");
  }

  if (stats.templates !== expect.templates) add("count", "templates", `expected ${expect.templates} template pages, found ${stats.templates}`);
  if (stateHubs.size !== expect.stateHubs) add("count", "state hubs", `expected ${expect.stateHubs}, found ${stateHubs.size}`);
  if (categoryHubs.size !== expect.categoryHubs) add("count", "category hubs", `expected ${expect.categoryHubs}, found ${categoryHubs.size}`);
  if (stats.templatesWithLoader !== stats.templatesInSitemap) {
    add("count", "templates", `${stats.templatesWithLoader} templates carry the loader but ${stats.templatesInSitemap} are in the sitemap`);
  }

  const sampled = samples.filter((route) => pageByRoute.has(route));
  if (sampled.length === 0) add("words", "samples", `none of ${samples.join(", ")} was prerendered`);
  for (const route of sampled) {
    const { html } = pageByRoute.get(route);
    const main = html.match(/<main\b[\s\S]*?<\/main>/i)?.[0] ?? "";
    const mainWords = wordCount(visibleText(main));
    const hiddenWords = [...main.matchAll(/<div hidden(?:="")? id="S:\d+"[^>]*>([\s\S]*?)<\/div>/g)].reduce((n, m) => n + wordCount(visibleText(m[1])), 0);
    stats[`words:${route}`] = mainWords;
    if (mainWords < minSampleWords) add("words", route, `${mainWords} words in <main>, expected at least ${minSampleWords}`);
    if (hiddenWords > 0) add("words", route, `${hiddenWords} words sit in hidden segments`);
  }

  return { ok: violations.length === 0, stats, violations };
}

function parseArgs(argv) {
  const args = { dir: path.join(repoRoot, ".next", "server", "app"), json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--dir") args.dir = path.resolve(argv[++i] ?? "");
    else if (argv[i] === "--json") args.json = true;
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = scanBuiltHtml({ appDir: args.dir });
  if (args.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const s = result.stats;
    console.log(`scan-built-html: ${s.pages ?? 0} pages, ${s.pagesWithLoader ?? 0} with the loader, ${s.templates ?? 0} templates (${s.templatesInSitemap ?? 0} in the sitemap, ${s.templatesNoindex ?? 0} noindex), ${s.stateHubs ?? 0} state hubs, ${s.categoryHubs ?? 0} category hubs, ${s.embedFrames ?? 0} embed frames`);
    for (const v of result.violations.slice(0, 200)) console.log(`FAIL [${v.check}] ${v.page}: ${v.detail}`);
    if (result.violations.length > 200) console.log(`... ${result.violations.length - 200} more`);
    console.log(result.ok ? "scan-built-html: OK" : `scan-built-html: ${result.violations.length} violation(s)`);
  }
  process.exit(result.ok ? 0 : 1);
}

const runDirectly = Boolean(process.argv[1]) && realpathSync(path.resolve(process.argv[1])) === realpathSync(__filename);
if (runDirectly) main();
