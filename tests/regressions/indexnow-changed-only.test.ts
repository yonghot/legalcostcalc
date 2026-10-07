import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(__dirname, "..", "..");
const scriptPath = path.join(repoRoot, "scripts", "indexnow.mjs");

const ORIGIN = "https://legalcostcalc.co";

interface Entry {
  loc: string;
  lastmod: string;
}
interface Diff {
  added: string[];
  removed: string[];
  changed: string[];
}
interface ScriptModule {
  parseSitemap(xml: string): { entries?: Entry[]; children?: string[] };
  diffSitemaps(prev: Entry[], next: Entry[]): Diff;
}

const loadModule = async (): Promise<ScriptModule> =>
  (await import(/* @vite-ignore */ pathToFileURL(scriptPath).href)) as ScriptModule;

const sitemap = (rows: Array<[string, string?]>) =>
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${rows
    .map(([loc, lastmod]) => `<url><loc>${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<priority>0.7</priority></url>`)
    .join("")}</urlset>`;

const U = (p: string) => `${ORIGIN}${p}`;
const E = (p: string, lastmod = ""): Entry => ({ loc: U(p), lastmod });

describe("IndexNow diff: only changed, new and removed URLs", () => {
  it("parseSitemap reads loc and lastmod", async () => {
    const { parseSitemap } = await loadModule();
    const { entries } = parseSitemap(
      sitemap([
        [U("/a"), "2026-10-08"],
        [U("/b"), "2026-10-08T00:00:00.000Z"],
        [U("/c")],
      ]),
    );
    expect(entries).toEqual([E("/a", "2026-10-08"), E("/b", "2026-10-08T00:00:00.000Z"), E("/c", "")]);
  });

  it("an unchanged sitemap submits 0 URLs", async () => {
    const { diffSitemaps } = await loadModule();
    const rows = [E("/a", "2026-10-08"), E("/b", "2026-10-08"), E("/c", "")];
    expect(diffSitemaps(rows, rows)).toEqual({ added: [], removed: [], changed: [] });
  });

  it("a changed lastmod submits exactly those URLs", async () => {
    const { diffSitemaps } = await loadModule();
    const baseline = [E("/a", "2026-06-29"), E("/b", "2026-06-29"), E("/c", "2026-06-29")];
    const built = [E("/a", "2026-10-08"), E("/b", "2026-06-29"), E("/c", "2026-10-08")];
    expect(diffSitemaps(baseline, built).changed).toEqual([U("/a"), U("/c")]);
  });

  it("a new URL is submitted", async () => {
    const { diffSitemaps } = await loadModule();
    const diff = diffSitemaps([E("/a", "2026-10-08")], [E("/a", "2026-10-08"), E("/new", "2026-10-08")]);
    expect(diff.added).toEqual([U("/new")]);
  });

  it("a URL that left the sitemap (for example turned noindex) is submitted so engines drop it", async () => {
    const { diffSitemaps } = await loadModule();
    const diff = diffSitemaps([E("/a", "2026-10-08"), E("/gone", "2026-10-08")], [E("/a", "2026-10-08")]);
    expect(diff.removed).toEqual([U("/gone")]);
  });

  it("a datetime and a date for the same day are not a change", async () => {
    const { parseSitemap, diffSitemaps } = await loadModule();
    const baseline = parseSitemap(sitemap([[U("/a"), "2026-10-08T00:00:00.000Z"]])).entries ?? [];
    const built = parseSitemap(sitemap([[U("/a"), "2026-10-08"]])).entries ?? [];
    expect(diffSitemaps(baseline, built)).toEqual({ added: [], removed: [], changed: [] });
  });

  it("a truncated sitemap body is rejected instead of reading as a tiny site", async () => {
    const { parseSitemap } = await loadModule();
    const full = sitemap([[U("/a"), "2026-10-08"], [U("/b"), "2026-10-08"], [U("/c"), "2026-10-08"]]);
    expect(() => parseSitemap(full.slice(0, full.length - 40))).toThrow(/complete sitemap document/);
  });
});

describe("IndexNow source and test hygiene", () => {
  const script = readFileSync(scriptPath, "utf8");

  it("the endpoint is overridable and the real endpoint appears only as the default", () => {
    expect(script).toContain("INDEXNOW_ENDPOINT");
    expect(script.match(/api\.indexnow\.org/g)?.length).toBe(1);
  });

  it("environment values use || so an empty string falls back", () => {
    expect(script).not.toMatch(/process\.env\.\w+\s*\?\?/);
    expect(script).not.toMatch(/env\.INDEXNOW_\w+\s*\?\?/);
  });

  it("the script keeps no state of its own between builds", () => {
    expect(script).not.toMatch(/INDEXNOW_BASELINE|INDEXNOW_SITEMAP_OVERRIDE|writeFile/);
  });

  it("the spawn-based indexnow test pins the origin and the endpoint to a closed local port in every spawn", () => {
    const older = readFileSync(path.join(repoRoot, "tests", "indexnow.test.ts"), "utf8");
    expect(older).toContain("INDEXNOW_ENDPOINT");
    expect(older).toContain("INDEXNOW_PROD_ORIGIN");
    expect(older).toContain("127.0.0.1:9");
  });
});
