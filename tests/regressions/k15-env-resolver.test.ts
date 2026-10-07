import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import "./helpers/render";

const ROOT = join(__dirname, "..", "..");
const PUBLIC_ID = "ca-pub-1378312299412437";
const PUBLIC_ADS_TXT = "google.com, pub-1378312299412437, DIRECT, f08c47fec0942fa0\n";
const GA_ENV_NAMES = ["NEXT_PUBLIC_GA_ID", "NEXT_PUBLIC_GA_MEASUREMENT_ID"] as const;
const BLANK_VALUES = [undefined, "", " ", "\t "] as const;

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function stub(name: string, value: string | undefined): void {
  vi.stubEnv(name, value);
}

async function adsTxtBody(): Promise<string> {
  vi.resetModules();
  const { GET } = await import("@/app/ads.txt/route");
  return GET().text();
}

async function adUnitMarkup(): Promise<string> {
  vi.resetModules();
  const { AdUnit } = await import("@/components/ads/ad-unit");
  return renderToStaticMarkup(createElement(AdUnit, { slot: "1234567890" }));
}

async function csp(): Promise<string> {
  vi.resetModules();
  const config = (await import("../../next.config")).default;
  const rules = await config.headers!();
  const catchAll = rules.find((rule) => !rule.source.startsWith("/embed"));
  return catchAll!.headers.find((h) => h.key === "Content-Security-Policy")!.value;
}

describe("K15: resolveGaId", () => {
  it.each(BLANK_VALUES)("is undefined when both names are %j", async (blank) => {
    stub("NEXT_PUBLIC_GA_ID", blank);
    stub("NEXT_PUBLIC_GA_MEASUREMENT_ID", blank);
    const { resolveGaId } = await import("@/lib/env");
    expect(resolveGaId()).toBeUndefined();
  });

  it("returns the trimmed NEXT_PUBLIC_GA_ID", async () => {
    stub("NEXT_PUBLIC_GA_ID", " G-AAAA111111 ");
    stub("NEXT_PUBLIC_GA_MEASUREMENT_ID", undefined);
    const { resolveGaId } = await import("@/lib/env");
    expect(resolveGaId()).toBe("G-AAAA111111");
  });

  it.each(["", " "])("falls through a %j NEXT_PUBLIC_GA_ID to NEXT_PUBLIC_GA_MEASUREMENT_ID", async (blank) => {
    stub("NEXT_PUBLIC_GA_ID", blank);
    stub("NEXT_PUBLIC_GA_MEASUREMENT_ID", " G-BBBB222222 ");
    const { resolveGaId } = await import("@/lib/env");
    expect(resolveGaId()).toBe("G-BBBB222222");
  });

  it("prefers NEXT_PUBLIC_GA_ID when both are configured", async () => {
    stub("NEXT_PUBLIC_GA_ID", "G-AAAA111111");
    stub("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-BBBB222222");
    const { resolveGaId } = await import("@/lib/env");
    expect(resolveGaId()).toBe("G-AAAA111111");
  });
});

describe("K15: ads.txt resolves the publisher id like every other consumer", () => {
  it.each(BLANK_VALUES)("serves the public pub line for %j, never the comment-only body", async (blank) => {
    stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", blank);
    stub("NEXT_PUBLIC_ADSTXT_REDIRECT_URL", undefined);
    const body = await adsTxtBody();
    expect(body).toBe(PUBLIC_ADS_TXT);
    expect(body.startsWith("#")).toBe(false);
  });

  it.each([" ca-pub-0000000000000000 ", "ca-pub-0000000000000000", "pub-0000000000000000", " pub-0000000000000000"])(
    "serves a configured value %j in the pub- form",
    async (value) => {
      stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", value);
      stub("NEXT_PUBLIC_ADSTXT_REDIRECT_URL", undefined);
      expect(await adsTxtBody()).toBe("google.com, pub-0000000000000000, DIRECT, f08c47fec0942fa0\n");
    },
  );
});

describe("K15: ad unit client id", () => {
  it.each(["", " "])("renders the public client id for %j", async (blank) => {
    stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", blank);
    const html = await adUnitMarkup();
    expect(html).toContain(`data-ad-client="${PUBLIC_ID}"`);
  });

  it("renders a configured, trimmed client id", async () => {
    stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", " pub-0000000000000000 ");
    expect(await adUnitMarkup()).toContain('data-ad-client="ca-pub-0000000000000000"');
  });

  it("renders nothing without a numeric slot, whatever the client id is", async () => {
    stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", "ca-pub-0000000000000000");
    vi.resetModules();
    const { AdUnit } = await import("@/components/ads/ad-unit");
    for (const slot of [undefined, "", " ", "rectangle", "TODO"]) {
      expect(renderToStaticMarkup(createElement(AdUnit, { slot }))).toBe("");
    }
  });
});

describe("K15: next.config gates on the same resolvers", () => {
  it.each(GA_ENV_NAMES)("allows googletagmanager in script-src when only %s is set", async (name) => {
    for (const other of GA_ENV_NAMES) stub(other, other === name ? " G-CCCC333333 " : "");
    const policy = await csp();
    expect(policy).toMatch(/script-src [^;]*https:\/\/www\.googletagmanager\.com/);
    expect(policy).toMatch(/connect-src [^;]*https:\/\/www\.google-analytics\.com/);
  });

  it("does not widen the GA origins when both GA names are blank", async () => {
    for (const name of GA_ENV_NAMES) stub(name, " ");
    expect(await csp()).not.toContain("googletagmanager.com");
  });

  it.each(["", " ", "ca-pub-0000000000000000"])("allows the ad origins for NEXT_PUBLIC_ADSENSE_CLIENT_ID=%j", async (value) => {
    stub("NEXT_PUBLIC_ADSENSE_CLIENT_ID", value);
    const policy = await csp();
    expect(policy).toContain("https://*.googlesyndication.com");
    expect(policy).toContain("https://*.adtrafficquality.google");
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|mjs)$/.test(name) ? [full] : [];
  });
}

describe("K15: source scan", () => {
  const files = [...sourceFiles(join(ROOT, "src")), join(ROOT, "next.config.ts")];
  const rel = (file: string) => relative(ROOT, file).split(sep).join("/");
  const ENV_READ = /process\.env\.NEXT_PUBLIC_(ADSENSE_CLIENT_ID|GA_ID|GA_MEASUREMENT_ID)\b/;

  it("never applies ?? to the AdSense or GA env names", () => {
    const offenders = files.filter((file) =>
      /NEXT_PUBLIC_(ADSENSE_CLIENT_ID|GA_ID|GA_MEASUREMENT_ID)\s*\)?\s*\?\?/.test(readFileSync(file, "utf8")),
    );
    expect(offenders.map(rel)).toEqual([]);
  });

  it("reads the AdSense and GA env names only inside src/lib/env.ts", () => {
    const offenders = files.filter((file) => ENV_READ.test(readFileSync(file, "utf8")));
    expect(offenders.map(rel)).toEqual(["src/lib/env.ts"]);
  });
});
