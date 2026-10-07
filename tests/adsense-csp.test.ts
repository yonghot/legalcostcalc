import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// K13 superseded by K13-R: Google supports only a strict nonce policy for AdSense, never a domain allowlist,
// so the site ships no fetch directive at all and the AdSense origins are not listed anywhere.
const FETCH_DIRECTIVES = [
  "default-src",
  "script-src",
  "script-src-elem",
  "script-src-attr",
  "style-src",
  "style-src-elem",
  "style-src-attr",
  "img-src",
  "connect-src",
  "frame-src",
  "child-src",
  "font-src",
  "media-src",
  "worker-src",
  "manifest-src",
  "fenced-frame-src",
  "form-action",
  "upgrade-insecure-requests",
  "sandbox",
  "report-uri",
  "report-to",
];

const PRE_K13R_CSP =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://*.adtrafficquality.google; " +
  "img-src 'self' data: https://*.googlesyndication.com; connect-src 'self' https://*.supabase.co; " +
  "frame-src https://*.googlesyndication.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'";

function fetchDirectivesIn(csp: string): string[] {
  const names = csp.split(";").map((part) => part.trim().split(/\s+/)[0]?.toLowerCase() ?? "");
  return names.filter((name) => FETCH_DIRECTIVES.includes(name));
}

async function cspValues(): Promise<string[]> {
  const { default: config } = await import("../next.config");
  const rules = (await config.headers?.()) ?? [];
  return rules.flatMap((rule) => rule.headers.filter((h) => h.key === "Content-Security-Policy").map((h) => h.value));
}

describe("AdSense CSP (K13 superseded by K13-R)", () => {
  it("positive control: the detector flags the pre-K13-R allowlist", () => {
    expect(fetchDirectivesIn(PRE_K13R_CSP)).toEqual([
      "default-src",
      "script-src",
      "img-src",
      "connect-src",
      "frame-src",
      "form-action",
    ]);
  });

  it("no header rule carries a fetch directive, so no Google origin is allowlisted or blocked", async () => {
    const values = await cspValues();
    expect(values).toHaveLength(2);
    for (const value of values) expect(fetchDirectivesIn(value)).toEqual([]);
  });

  it("next.config lists no AdSense, Google or Supabase origin and does not read the ad env", () => {
    const source = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    expect(source).not.toMatch(/adtrafficquality|googlesyndication|doubleclick|googletagmanager|google-analytics|supabase/i);
    expect(source).not.toMatch(/process\.env|resolveAdsenseClient|resolveGaId/);
  });

  it("only the embed rule allows framing, and the /embed landing page keeps the page policy", async () => {
    const { default: config } = await import("../next.config");
    const rules = (await config.headers?.()) ?? [];
    const framing = rules.filter((rule) => rule.headers.some((h) => /frame-ancestors \*/.test(h.value)));
    expect(framing.map((rule) => rule.source)).toEqual(["/embed/:path+"]);
    expect(framing[0]?.headers.map((h) => h.key.toLowerCase())).not.toContain("x-frame-options");
    const others = rules.filter((rule) => rule.source !== "/embed/:path+");
    expect(others).toHaveLength(1);
    const xfo = others[0]?.headers.find((h) => h.key === "X-Frame-Options");
    expect(xfo?.value).toBe("DENY");
  });
});
