// K13-R header contract (contracts.md K13-R (7) a/b/c). Template from D:\ClaudeCode\AppFarm\scripts\templates.
// Copy to tests/regressions/csp-k13r.test.ts and edit ONLY the CONFIG block. Same matcher as scripts/lib/k13r.mjs.
// Template commit 9de0807 (D:\ClaudeCode\AppFarm\scripts).
import { beforeAll, describe, expect, it, vi } from "vitest";
import { closeSync, existsSync, openSync, readFileSync, readSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { tryToParsePath } from "next/dist/lib/try-to-parse-path";

type Kind = "page" | "embed" | "tight";
type Header = { key: string; value: string };
type Rule = { source: string; headers: Header[] };

const CONFIG = {
  repoRoot: path.resolve(__dirname, "..", ".."),
  nextConfig: "next.config.ts",
  // P probes: "/", "/about", one template page, "/embedded-x", "/widgetx", "/widget/anything", and "/embed" for the /embed family.
  pageProbes: ["/", "/about", "/california/divorce-cost", "/embedded-x", "/widgetx", "/widget/anything", "/embed"],
  // E probes: "/widget" (widget family) or "/embed/<sample>" (embed family). Leave empty when the route is E-tight.
  embedProbes: ["/embed/california/divorce-cost"] as string[],
  // E-tight (obbb, catchupcalc /widget only): exact current widgetCsp bytes.
  tightProbes: {} as Record<string, string>,
  // Env names that could change headers; results must be identical with and without them.
  envKeys: ["NEXT_PUBLIC_ADSENSE_CLIENT_ID", "NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_VERCEL_ENV"],
  edgeFiles: ["proxy.ts", "middleware.ts", "src/proxy.ts", "src/middleware.ts", "vercel.json"],
  sourceDirs: ["src"],
  prerenderDir: ".next/server/app",
  // Positive control (K28(3)): this repo's pre-K13-R CSP strings; each must be rejected.
  preFix: [
    { name: "HEAD and live page header (domain allowlist, SAMEORIGIN)", kind: "page", csp: "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://adservice.google.com https://www.googletagservices.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google; frame-ancestors 'none'; base-uri 'self'; form-action 'self'", xfo: "SAMEORIGIN", permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
    { name: "HEAD embed header (domain allowlist, invalid ALLOWALL)", kind: "embed", csp: "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.googleadservices.com https://adservice.google.com https://www.googletagservices.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.gstatic.com https://*.adtrafficquality.google; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://pagead2.googlesyndication.com https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net https://*.adtrafficquality.google https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com; frame-src https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com https://*.adtrafficquality.google; frame-ancestors *; base-uri 'self'; form-action 'self'", xfo: "ALLOWALL", permissionsPolicy: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  ] as Array<{ name: string; kind: Kind; csp: string; xfo?: string; permissionsPolicy?: string; snapshot?: string }>,
};

const PAGE = "object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
const EMBED = "object-src 'none'; base-uri 'none'; frame-ancestors *";
const ALLOWED = ["object-src", "base-uri", "frame-ancestors"];

function evaluate(kind: Kind, headers: Header[], snapshot: string | null = null): string[] {
  const all = (name: string) => headers.filter((h) => h.key.toLowerCase() === name).flatMap((h) => h.value.split(",").map((v) => v.trim()).filter(Boolean));
  const fail: string[] = [];
  const csp = all("content-security-policy");
  const xfo = all("x-frame-options");
  if (all("content-security-policy-report-only").length) fail.push("report-only");
  if (/browsing-topics=\(\)/.test(all("permissions-policy").join(","))) fail.push("browsing-topics");
  if (csp.length !== 1) return [...fail, `csp-count:${csp.length}`];
  const value = csp[0] ?? "";
  if (kind === "tight") {
    if (value !== snapshot) fail.push("tight-snapshot");
  } else {
    const names = value.split(";").map((p) => p.trim().split(/\s+/)[0]?.toLowerCase()).filter((n): n is string => Boolean(n));
    if (names.some((n) => !ALLOWED.includes(n))) fail.push("directive-set");
    if (value !== (kind === "embed" ? EMBED : PAGE)) fail.push("literal");
  }
  if (kind === "page" ? !(xfo.length === 1 && xfo[0]?.toUpperCase() === "DENY") : xfo.length > 0) fail.push("xfo");
  return fail;
}

const hasMetaCsp = (html: string) => /<meta\b[^>]*http-equiv\s*=\s*["']?\s*content-security-policy/i.test(html);

// A meta CSP is only honoured inside <head>; reading just the head keeps 1,000+ page prerender trees under the 5 s timeout.
// No silent cap: if </head> is not inside the first 32 KB the whole file is read.
function readHead(file: string): string {
  const fd = openSync(file, "r");
  try {
    const buf = Buffer.alloc(32 * 1024);
    const text = buf.subarray(0, readSync(fd, buf, 0, buf.length, 0)).toString("utf8");
    const end = text.search(/<\/head>/i);
    return end >= 0 ? text.slice(0, end) : readFileSync(file, "utf8");
  } finally {
    closeSync(fd);
  }
}

async function loadRules(): Promise<Rule[]> {
  vi.resetModules();
  const mod = await import(/* @vite-ignore */ pathToFileURL(path.join(CONFIG.repoRoot, CONFIG.nextConfig)).href);
  return (await mod.default.headers()) as Rule[];
}

function matching(rules: Rule[], pathname: string): Rule[] {
  return rules.filter((r) => {
    const parsed = tryToParsePath(r.source);
    if (parsed.error || !parsed.regexStr) throw new Error(`unparsable header source ${r.source}`);
    return new RegExp(parsed.regexStr, "i").test(pathname);
  });
}

// Next 16 emits a "<page>.segments" prefetch directory (RSC payloads, no HTML) per prerendered page; skipping them and
// using dirents instead of statSync keeps a 1,000+ page tree walk in tens of milliseconds.
function walk(dir: string, exts: RegExp, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!entry.name.endsWith(".segments")) walk(p, exts, out);
    } else if (exts.test(entry.name)) out.push(p);
  }
  return out;
}

const probes: Array<{ pathname: string; kind: Kind; snapshot: string | null }> = [
  ...CONFIG.pageProbes.map((pathname) => ({ pathname, kind: "page" as Kind, snapshot: null })),
  ...CONFIG.embedProbes.map((pathname) => ({ pathname, kind: "embed" as Kind, snapshot: null })),
  ...Object.entries(CONFIG.tightProbes).map(([pathname, snapshot]) => ({ pathname, kind: "tight" as Kind, snapshot })),
];

describe("K13-R (a): next.config headers per probe path", () => {
  it.each(probes)("$pathname ($kind) matches exactly one rule and meets the K13-R literal", async ({ pathname, kind, snapshot }) => {
    const hits = matching(await loadRules(), pathname);
    expect(hits.map((r) => r.source)).toHaveLength(1);
    expect(evaluate(kind, hits[0]?.headers ?? [], snapshot)).toEqual([]);
  });

  it("headers are identical with and without every env key (literal constants, no env branch)", async () => {
    const snapshotOf = async () => JSON.stringify(await loadRules());
    for (const key of CONFIG.envKeys) vi.stubEnv(key, "");
    vi.stubEnv("NODE_ENV", "production");
    const without = await snapshotOf();
    for (const key of CONFIG.envKeys) vi.stubEnv(key, key === "NEXT_PUBLIC_VERCEL_ENV" ? "production" : `test-${key.toLowerCase()}`);
    vi.stubEnv("NODE_ENV", "development");
    const withEnv = await snapshotOf();
    vi.unstubAllEnvs();
    expect(withEnv).toBe(without);
  });
});

describe("K13-R (b): no second CSP source", () => {
  it("proxy/middleware/vercel.json carry no Content-Security-Policy and no nonce", () => {
    for (const rel of CONFIG.edgeFiles) {
      const p = path.join(CONFIG.repoRoot, rel);
      if (!existsSync(p)) continue;
      const text = readFileSync(p, "utf8");
      expect(text, rel).not.toMatch(/content-security-policy/i);
      expect(text, rel).not.toMatch(/\bnonce\b/i);
    }
  });

  let sourceOffenders: string[] = [];
  beforeAll(() => {
    const files = CONFIG.sourceDirs.flatMap((d) => walk(path.join(CONFIG.repoRoot, d), /\.(t|j)sx?$|\.mdx?$/));
    sourceOffenders = files.filter((f) => /http-?equiv\s*=\s*\{?\s*["'`]content-security-policy/i.test(readFileSync(f, "utf8")));
  });

  it("no source file renders a meta CSP (http-equiv / httpEquiv)", () => {
    expect(sourceOffenders).toEqual([]);
  });

  // The I/O-heavy scan of the prerender tree runs in a hook so a loaded full run cannot time out the assertion itself.
  let prerenderOffenders: string[] = [];
  beforeAll(() => {
    const html = walk(path.join(CONFIG.repoRoot, CONFIG.prerenderDir), /\.html$/);
    prerenderOffenders = html.filter((f) => hasMetaCsp(readHead(f)));
  });

  it("no prerendered HTML carries a meta CSP (skipped files: none when the build output is absent)", () => {
    expect(prerenderOffenders).toEqual([]);
  });
});

describe("K13-R (c): positive controls — the matcher must reject known-bad headers", () => {
  const synthetic: Array<{ name: string; kind: Kind; headers: Header[] }> = [
    { name: "script-src injected", kind: "page", headers: [{ key: "Content-Security-Policy", value: `${PAGE}; script-src 'self'` }, { key: "X-Frame-Options", value: "DENY" }] },
    { name: "two CSP headers", kind: "page", headers: [{ key: "Content-Security-Policy", value: PAGE }, { key: "Content-Security-Policy", value: PAGE }, { key: "X-Frame-Options", value: "DENY" }] },
    { name: "P without X-Frame-Options", kind: "page", headers: [{ key: "Content-Security-Policy", value: PAGE }] },
    { name: "/embed landing with frame-ancestors *", kind: "page", headers: [{ key: "Content-Security-Policy", value: EMBED }, { key: "X-Frame-Options", value: "DENY" }] },
    { name: "Report-Only alongside", kind: "page", headers: [{ key: "Content-Security-Policy", value: PAGE }, { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'" }, { key: "X-Frame-Options", value: "DENY" }] },
    { name: "embed with X-Frame-Options", kind: "embed", headers: [{ key: "Content-Security-Policy", value: EMBED }, { key: "X-Frame-Options", value: "DENY" }] },
  ];

  it.each(synthetic)("rejects: $name", ({ kind, headers }) => {
    expect(evaluate(kind, headers).length).toBeGreaterThan(0);
  });

  it("CONFIG.preFix holds at least one pre-fix header of this repo", () => {
    expect(CONFIG.preFix.length).toBeGreaterThan(0);
  });

  it.each(CONFIG.preFix)("rejects this repo's pre-fix header: $name", ({ kind, csp, xfo, permissionsPolicy, snapshot }) => {
    const headers: Header[] = [
      { key: "Content-Security-Policy", value: csp },
      ...(xfo ? [{ key: "X-Frame-Options", value: xfo }] : []),
      ...(permissionsPolicy ? [{ key: "Permissions-Policy", value: permissionsPolicy }] : []),
    ];
    expect(evaluate(kind, headers, snapshot ?? null).length).toBeGreaterThan(0);
  });

  it("readHead still finds a meta CSP placed after a 40 KB head (no silent 32 KB cap)", () => {
    const file = path.join(tmpdir(), `csp-k13r-head-${process.pid}.html`);
    const bigHead = `<script>${"x".repeat(40 * 1024)}</script>`;
    writeFileSync(file, `<html><head>${bigHead}<meta http-equiv="Content-Security-Policy" content="${PAGE}"></head><body></body></html>`);
    try {
      expect(hasMetaCsp(readHead(file))).toBe(true);
    } finally {
      unlinkSync(file);
    }
  });

  it("the meta-CSP scanner flags a synthetic meta tag", () => {
    expect(hasMetaCsp(`<head><meta http-equiv="Content-Security-Policy" content="${PAGE}"></head>`)).toBe(true);
    expect(hasMetaCsp('<head><meta name="description" content="x"></head>')).toBe(false);
  });
});
