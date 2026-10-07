import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = path.resolve(__dirname, "..", "..");
const scriptPath = path.join(repoRoot, "scripts", "indexnow.mjs");

const CLOSED = "http://127.0.0.1:9";
const KEY = "0123456789abcdef0123456789abcdef";
const ORIGIN = "https://legalcostcalc.co";

interface Entry {
  loc: string;
  lastmod: string;
}
interface Diff {
  added: string[];
  modified: string[];
  removed: string[];
  urls: string[];
}
interface Payload {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
}
interface ScriptModule {
  parseSitemapEntries(xml: string): Entry[];
  diffSitemaps(baseline: Entry[], built: Entry[]): Diff;
  buildPayloads(options: { urls: string[]; origin: string; key: string; chunkSize?: number }): Payload[];
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
  it("parseSitemapEntries reads loc and lastmod, with datetimes reduced to the date", async () => {
    const { parseSitemapEntries } = await loadModule();
    const entries = parseSitemapEntries(
      sitemap([
        [U("/a"), "2026-10-08"],
        [U("/b"), "2026-10-08T00:00:00.000Z"],
        [U("/c")],
      ]),
    );
    expect(entries).toEqual([E("/a", "2026-10-08"), E("/b", "2026-10-08"), E("/c", "")]);
  });

  it("an unchanged sitemap submits 0 URLs", async () => {
    const { diffSitemaps } = await loadModule();
    const rows = [E("/a", "2026-10-08"), E("/b", "2026-10-08"), E("/c", "")];
    expect(diffSitemaps(rows, rows).urls).toEqual([]);
  });

  it("a changed lastmod submits exactly those URLs", async () => {
    const { diffSitemaps } = await loadModule();
    const baseline = [E("/a", "2026-06-29"), E("/b", "2026-06-29"), E("/c", "2026-06-29")];
    const built = [E("/a", "2026-10-08"), E("/b", "2026-06-29"), E("/c", "2026-10-08")];
    const diff = diffSitemaps(baseline, built);
    expect(diff.modified).toEqual([U("/a"), U("/c")]);
    expect(diff.urls).toEqual([U("/a"), U("/c")]);
  });

  it("a new URL is submitted", async () => {
    const { diffSitemaps } = await loadModule();
    const diff = diffSitemaps([E("/a", "2026-10-08")], [E("/a", "2026-10-08"), E("/new", "2026-10-08")]);
    expect(diff.added).toEqual([U("/new")]);
    expect(diff.urls).toEqual([U("/new")]);
  });

  it("a URL that left the sitemap (for example turned noindex) is submitted so engines drop it", async () => {
    const { diffSitemaps } = await loadModule();
    const diff = diffSitemaps([E("/a", "2026-10-08"), E("/gone", "2026-10-08")], [E("/a", "2026-10-08")]);
    expect(diff.removed).toEqual([U("/gone")]);
    expect(diff.urls).toEqual([U("/gone")]);
  });

  it("a datetime and a date for the same day are not a change", async () => {
    const { parseSitemapEntries, diffSitemaps } = await loadModule();
    const baseline = parseSitemapEntries(sitemap([[U("/a"), "2026-10-08T00:00:00.000Z"]]));
    const built = parseSitemapEntries(sitemap([[U("/a"), "2026-10-08"]]));
    expect(diffSitemaps(baseline, built).urls).toEqual([]);
  });

  it("buildPayloads carries host, key location and chunks, and drops URLs from another host", async () => {
    const { buildPayloads } = await loadModule();
    const payloads = buildPayloads({
      urls: [U("/a"), U("/b"), U("/c"), "https://other.example/x"],
      origin: ORIGIN,
      key: KEY,
      chunkSize: 2,
    });
    expect(payloads.map((p) => p.urlList)).toEqual([[U("/a"), U("/b")], [U("/c")]]);
    for (const payload of payloads) {
      expect(payload.host).toBe("legalcostcalc.co");
      expect(payload.keyLocation).toBe(`${ORIGIN}/${KEY}.txt`);
    }
  });
});

describe("IndexNow script run as the postbuild step", () => {
  let dir = "";

  beforeAll(() => {
    dir = mkdtempSync(path.join(tmpdir(), "indexnow-"));
  });
  afterAll(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  function run(built: string, baseline: string | null, extra: Record<string, string> = {}) {
    const builtFile = path.join(dir, "built.xml");
    writeFileSync(builtFile, built);
    const env: Record<string, string> = {};
    for (const [k, v] of Object.entries(process.env)) if (v !== undefined && !k.startsWith("INDEXNOW_")) env[k] = v;
    Object.assign(env, {
      VERCEL_ENV: "production",
      INDEXNOW_KEY: KEY,
      NEXT_PUBLIC_APP_URL: ORIGIN,
      INDEXNOW_SITEMAP_OVERRIDE: builtFile,
      INDEXNOW_ENDPOINT: `${CLOSED}/indexnow`,
      INDEXNOW_BASELINE_URL: `${CLOSED}/sitemap.xml`,
    });
    if (baseline !== null) {
      const baselineFile = path.join(dir, "baseline.xml");
      writeFileSync(baselineFile, baseline);
      env.INDEXNOW_BASELINE_FILE = baselineFile;
    }
    Object.assign(env, extra);
    const result = spawnSync("node", [scriptPath, "postbuild"], { cwd: repoRoot, env, encoding: "utf8", timeout: 60_000 });
    return { status: result.status, out: `${result.stdout}${result.stderr}` };
  }

  const built = sitemap([
    [U("/a"), "2026-10-08"],
    [U("/b"), "2026-10-08"],
    [U("/new"), "2026-10-08"],
  ]);

  it("an unchanged sitemap posts nothing", () => {
    const { status, out } = run(built, built);
    expect(status).toBe(0);
    expect(out).toContain("0 changed urls");
    expect(out).toContain("nothing to submit");
    expect(out).not.toMatch(/posting|HTTP|failed/);
    expect(out).not.toContain(KEY);
  });

  it("a changed sitemap posts only the diff, to the overridden endpoint, and never prints the key", () => {
    const baseline = sitemap([
      [U("/a"), "2026-06-29"],
      [U("/b"), "2026-10-08"],
      [U("/gone"), "2026-10-08"],
    ]);
    const { status, out } = run(built, baseline);
    expect(status).toBe(0);
    expect(out).toContain("3 changed urls (1 new, 1 lastmod changed, 1 removed) of 3 in the built sitemap");
    expect(out).toContain("posting 1 batch(es) to 127.0.0.1:9");
    expect(out).toMatch(/batch 1\/1 \(3 urls\) failed/);
    expect(out).not.toContain("api.indexnow.org");
    expect(out).not.toContain(KEY);
  });

  it("an unreachable baseline submits nothing and never falls back to the full list", () => {
    const { status, out } = run(built, null);
    expect(status).toBe(0);
    expect(out).toContain("baseline sitemap");
    expect(out).toContain("submitting nothing");
    expect(out).not.toMatch(/posting|changed urls/);
    expect(out).not.toContain(KEY);
  });

  it("a baseline that is not a sitemap submits nothing", () => {
    const { status, out } = run(built, "<html><body>Application error</body></html>");
    expect(status).toBe(0);
    expect(out).toContain("submitting nothing");
    expect(out).not.toMatch(/posting|changed urls/);
  });

  it("local builds (not production) never post", () => {
    const { status, out } = run(built, built, { VERCEL_ENV: "preview" });
    expect(status).toBe(0);
    expect(out).toContain("not production");
    expect(out).not.toMatch(/posting|changed urls/);
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
  });

  it("the older indexnow test pins the endpoint and the baseline to a closed local port in every spawn", () => {
    const older = readFileSync(path.join(repoRoot, "tests", "indexnow.test.ts"), "utf8");
    expect(older).toContain("INDEXNOW_ENDPOINT");
    expect(older).toContain("INDEXNOW_BASELINE_URL");
    expect(older).toContain("127.0.0.1:9");
  });
});
