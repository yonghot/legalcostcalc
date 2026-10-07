import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import "./helpers/render";
import type { LegalCostData } from "@/lib/types";
import { AffiliateCTA } from "@/components/shared/affiliate-cta";
import { ResultMonetization } from "@/components/monetization/ResultMonetization";
import { CostResult } from "@/components/calculator/cost-result";

const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");
const DISCLOSURE = "We may earn a commission";

const AFFILIATE_ENVS = [
  "NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL",
  "NEXT_PUBLIC_AFFILIATE_ROCKETLAWYER_URL",
  "NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL",
  "NEXT_PUBLIC_AFFILIATE_AVVO_URL",
  "NEXT_PUBLIC_AFFILIATE_NOLO_URL",
  "NEXT_PUBLIC_AFFILIATE_LAWDEPOT_URL",
] as const;

const MONETIZATION_ENVS = [
  "NEXT_PUBLIC_AD_PROVIDER",
  "NEXT_PUBLIC_ADSENSE_SLOT_ID",
  "NEXT_PUBLIC_EZOIC_SCRIPT_SRC",
  "NEXT_PUBLIC_RAPTIVE_SITE_ID",
  "NEXT_PUBLIC_JOURNEY_SITE_ID",
  "NEXT_PUBLIC_ADSTXT_REDIRECT_URL",
  "NEXT_PUBLIC_PRIMARY_CTA_TYPE",
  "NEXT_PUBLIC_PPC_NUMBER",
  "NEXT_PUBLIC_PPC_LABEL",
  "NEXT_PUBLIC_CPL_URL",
  "NEXT_PUBLIC_CPL_LABEL",
  "NEXT_PUBLIC_SPONSOR_HTML",
  "NEXT_PUBLIC_SPONSOR_BACKFILL_URL",
  "NEXT_PUBLIC_EMAIL_CAPTURE",
  "NEXT_PUBLIC_POSTAL_ADDRESS",
  "MON_FEATURED_PARTNERS",
  ...AFFILIATE_ENVS,
] as const;

const COST: LegalCostData = {
  id: "test-divorce-ca-moderate",
  category: "divorce",
  stateCode: "CA",
  complexity: "moderate",
  costRange: { low: 5900, median: 8000, high: 10600 },
  hourlyRate: { low: 250, median: 320, high: 450 },
  contingencyFee: null,
  typicalDuration: "6-12 months",
  commonFees: ["Filing fee", "Service of process"],
  sources: ["https://example.com/source-1", "https://example.com/source-2"],
  lastVerifiedAt: "2026-04-01",
};

const PARTNER_ROWS = [{ label: "ExamplePartner", figure: "From $79", href: "https://partner.example.com/x" }];

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

function unsetAll(): void {
  for (const name of MONETIZATION_ENVS) vi.stubEnv(name, undefined);
}

function monetizationHtml(props: Record<string, unknown> = {}): string {
  return renderToStaticMarkup(createElement(ResultMonetization, { categorySlug: "divorce", ...props }));
}

function visibleText(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

function expectDisclosureBefore(html: string, marker: string): void {
  const disclosure = html.indexOf(DISCLOSURE);
  const target = html.indexOf(marker);
  expect(target, `${marker} must render`).toBeGreaterThan(-1);
  expect(disclosure, "FTC disclosure must render").toBeGreaterThan(-1);
  expect(disclosure).toBeLessThan(target);
}

describe("K25: nothing renders while every monetization env is unset", () => {
  it("ResultMonetization renders no text, no ad frame and no accessible ad label", () => {
    unsetAll();
    const html = monetizationHtml();
    expect(visibleText(html)).toBe("");
    expect(html).not.toMatch(/Advertisement|aria-label|<ins|adsbygoogle|min-h-/);
  });

  it("AffiliateCTA renders nothing", () => {
    unsetAll();
    expect(renderToStaticMarkup(createElement(AffiliateCTA, { categorySlug: "divorce" }))).toBe("");
  });

  it("a configured numeric slot restores the reserved ad frame", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_ID", "1234567890");
    const html = monetizationHtml();
    expect(html).toMatch(/min-h-\[90px\]/);
    expect(html).toContain('data-ad-slot="1234567890"');
  });
});

describe("K25: every rendered affiliate or sponsor block carries the FTC disclosure first", () => {
  it.each(AFFILIATE_ENVS)("AffiliateCTA with %s set", (name) => {
    unsetAll();
    vi.stubEnv(name, "https://example.com/affiliate/test");
    const html = renderToStaticMarkup(createElement(AffiliateCTA, {}));
    expectDisclosureBefore(html, 'href="https://example.com/affiliate/test"');
  });

  it("pay-per-call CTA", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE", "call");
    vi.stubEnv("NEXT_PUBLIC_PPC_NUMBER", "+18005551234");
    expectDisclosureBefore(monetizationHtml(), 'href="tel:+18005551234"');
  });

  it("cost-per-lead CTA", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE", "cpl");
    vi.stubEnv("NEXT_PUBLIC_CPL_URL", "https://example.com/lead");
    expectDisclosureBefore(monetizationHtml(), 'href="https://example.com/lead"');
  });

  it("featured affiliate CTA", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_PRIMARY_CTA_TYPE", "affiliate");
    vi.stubEnv("NEXT_PUBLIC_AFFILIATE_LEGALZOOM_URL", "https://example.com/affiliate/lz");
    expectDisclosureBefore(monetizationHtml(), 'href="https://example.com/affiliate/lz"');
  });

  it("sponsor text", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_SPONSOR_HTML", "Sponsor message");
    expectDisclosureBefore(monetizationHtml(), "Sponsor message");
  });

  it("sponsor backfill link", () => {
    unsetAll();
    vi.stubEnv("NEXT_PUBLIC_SPONSOR_BACKFILL_URL", "https://example.com/sponsor");
    expectDisclosureBefore(monetizationHtml(), 'href="https://example.com/sponsor"');
  });

  it("featured partner table", () => {
    unsetAll();
    expectDisclosureBefore(monetizationHtml({ featuredPartners: PARTNER_ROWS }), "<table");
  });
});

describe("K25: featured partners reach the client only as a server-parsed prop", () => {
  it("renders the table from the prop", () => {
    unsetAll();
    const html = monetizationHtml({ featuredPartners: PARTNER_ROWS });
    expect(html).toContain("ExamplePartner");
    expect(html).toContain('href="https://partner.example.com/x"');
  });

  it("does not read MON_FEATURED_PARTNERS itself", () => {
    unsetAll();
    vi.stubEnv("MON_FEATURED_PARTNERS", JSON.stringify(PARTNER_ROWS));
    const html = monetizationHtml();
    expect(html).not.toContain("<table");
    expect(html).not.toContain(DISCLOSURE);
  });

  it("CostResult forwards the prop to the stack", () => {
    unsetAll();
    const html = renderToStaticMarkup(
      createElement(CostResult, {
        results: [COST],
        stateName: "California",
        categoryName: "Divorce",
        categorySlug: "divorce",
        stateCode: "CA",
        stateSlug: "california",
        featuredPartners: PARTNER_ROWS,
      }),
    );
    expect(html).toContain("ExamplePartner");
  });

  it("getFeaturedPartners parses the server env", async () => {
    unsetAll();
    const { getFeaturedPartners } = await import("@/lib/featured-partners");
    expect(getFeaturedPartners()).toEqual([]);
    vi.stubEnv("MON_FEATURED_PARTNERS", "not json");
    expect(getFeaturedPartners()).toEqual([]);
    vi.stubEnv("MON_FEATURED_PARTNERS", ` ${JSON.stringify(PARTNER_ROWS)} `);
    expect(getFeaturedPartners()).toEqual(PARTNER_ROWS);
  });

  it.each(["src/app/page.tsx", "src/app/[state]/[slug]/page.tsx"])("%s parses on the server and passes the prop", (file) => {
    const source = readFileSync(join(ROOT, file), "utf8");
    expect(source).toMatch(/featuredPartners=\{getFeaturedPartners\(\)\}/);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(name) ? [full] : [];
  });
}

function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

function resolveLocalImport(from: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? join(SRC, specifier.slice(2))
    : specifier.startsWith(".")
      ? resolve(dirname(from), specifier)
      : null;
  if (!base) return null;
  const candidates = [`${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx"), base];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile()) ?? null;
}

function clientClosure(): string[] {
  const files = sourceFiles(SRC);
  const roots = files.filter((f) => /^\s*(["'])use client\1/.test(stripComments(readFileSync(f, "utf8")).trimStart()));
  const seen = new Set<string>();
  const stack = [...roots];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g)) {
      const target = resolveLocalImport(file, match[1]);
      if (target && !seen.has(target)) stack.push(target);
    }
  }
  return [...seen];
}

describe("K25: client bundle never references a server-only env name", () => {
  const closure = clientClosure();

  it("finds the client modules", () => {
    expect(closure.length).toBeGreaterThan(40);
    expect(closure.map((f) => relative(ROOT, f).split(sep).join("/"))).toContain("src/lib/monetization.ts");
  });

  it("reads only NEXT_PUBLIC_* and NODE_ENV from process.env in modules reachable from a use-client file", () => {
    const offenders: string[] = [];
    for (const file of closure) {
      const code = stripComments(readFileSync(file, "utf8"));
      for (const match of code.matchAll(/process\.env\.([A-Z0-9_]+)|process\.env\[/g)) {
        const name = match[1];
        if (name && (name.startsWith("NEXT_PUBLIC_") || name === "NODE_ENV")) continue;
        offenders.push(`${relative(ROOT, file).split(sep).join("/")}: ${match[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe("K25: no config field without a reader", () => {
  const monetization = readFileSync(join(SRC, "lib", "monetization.ts"), "utf8");
  const fields = [...(monetization.match(/export interface MonetizationConfig \{([\s\S]*?)\n\}/)?.[1] ?? "").matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
  const others = sourceFiles(SRC)
    .filter((f) => !f.endsWith(`${sep}lib${sep}monetization.ts`))
    .map((f) => stripComments(readFileSync(f, "utf8")))
    .join("\n");

  it("parses the interface", () => {
    expect(fields.length).toBeGreaterThan(5);
  });

  it.each(fields)("%s is read somewhere outside monetization.ts", (field) => {
    expect(others).toMatch(new RegExp(`\\b${field}\\b`));
  });
});

describe("K25: docs/ACTIVATION.md", () => {
  const activationPath = join(ROOT, "docs", "ACTIVATION.md");
  const doc = existsSync(activationPath) ? readFileSync(activationPath, "utf8") : "";
  const sources = sourceFiles(SRC).map((f) => stripComments(readFileSync(f, "utf8"))).join("\n");
  const documented = [...new Set([...doc.matchAll(/`((?:NEXT_PUBLIC_|MON_)[A-Z0-9_]+)`/g)].map((m) => m[1]))];

  it("exists and lists env names", () => {
    expect(existsSync(activationPath)).toBe(true);
    expect(documented.length).toBeGreaterThan(15);
  });

  it("lists only names the code reads", () => {
    const unread = documented.filter((name) => !new RegExp(`\\b${name}\\b`).test(sources));
    expect(unread).toEqual([]);
  });

  it("lists every monetization env name the code reads", () => {
    const files = [
      "src/lib/monetization.ts",
      "src/lib/constants/affiliates.ts",
      "src/lib/ad-slots.ts",
      "src/lib/env.ts",
      "src/components/monetization/AdProvider.tsx",
      "src/app/ads.txt/route.ts",
    ];
    const read = new Set<string>();
    for (const file of files) {
      const code = stripComments(readFileSync(join(ROOT, file), "utf8"));
      for (const m of code.matchAll(/\b((?:NEXT_PUBLIC_|MON_)[A-Z0-9_]+)\b/g)) read.add(m[1]);
    }
    expect([...read].filter((name) => !documented.includes(name))).toEqual([]);
  });

  it("carries names only, never a value", () => {
    expect(doc).not.toMatch(/\b(?:NEXT_PUBLIC_|MON_)[A-Z0-9_]+\s*=\s*\S/);
    expect(doc).not.toMatch(/ca-pub-\d|pub-\d{6}|https?:\/\/(?!support\.google\.com)/);
  });

  it.each([
    "NEXT_PUBLIC_AFFILIATE_LEGALMATCH_URL",
    "NEXT_PUBLIC_AFFILIATE_AVVO_URL",
    "NEXT_PUBLIC_AFFILIATE_NOLO_URL",
    "NEXT_PUBLIC_CPL_URL",
    "NEXT_PUBLIC_PPC_NUMBER",
    "NEXT_PUBLIC_EMAIL_CAPTURE",
  ])("marks %s as held", (name) => {
    const row = doc.split("\n").find((line) => line.includes(`\`${name}\``));
    expect(row, `${name} row`).toBeDefined();
    expect(row).toMatch(/\bHOLD\b/);
  });

  it("does not offer the other networks for activation", () => {
    for (const name of ["NEXT_PUBLIC_EZOIC_SCRIPT_SRC", "NEXT_PUBLIC_RAPTIVE_SITE_ID", "NEXT_PUBLIC_JOURNEY_SITE_ID", "NEXT_PUBLIC_ADSTXT_REDIRECT_URL"]) {
      const row = doc.split("\n").find((line) => line.includes(`\`${name}\``));
      expect(row, `${name} row`).toMatch(/\bDO NOT SET\b/);
    }
  });
});
