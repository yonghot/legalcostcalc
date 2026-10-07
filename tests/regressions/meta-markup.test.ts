import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { setPathname } from "./helpers/render";
import { SiteChrome } from "@/components/layout/site-chrome";
import ContactPage from "@/app/contact/page";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { metadata as privacyMeta } from "@/app/privacy/page";
import { metadata as termsMeta } from "@/app/terms/page";
import { metadata as embedMeta } from "@/app/embed/page";
import { metadata as guideMeta } from "@/app/how-legal-fees-work/page";

const ROOT = join(__dirname, "..", "..");
const APP_DIR = join(ROOT, "src", "app");

const ROUTES: Array<[string, string, Metadata]> = [
  ["/privacy", "Privacy Policy — LegalCostCalc", privacyMeta],
  ["/terms", "Terms of Service — LegalCostCalc", termsMeta],
  ["/embed", "Embed the Legal Cost Calculator — LegalCostCalc", embedMeta],
  ["/how-legal-fees-work", "", guideMeta],
];

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

describe("meta: og:url equals the canonical URL and og:image is present", () => {
  it.each(ROUTES)("%s", (path, title, meta) => {
    expect(meta.alternates?.canonical).toBe(path);
    const og = meta.openGraph as { url?: string; images?: Array<{ url: string; width?: number; height?: number }> };
    expect(og?.url).toBe(`${CANONICAL_ORIGIN}${path}`);
    expect(og?.images?.map((i) => i.url)).toEqual(["/opengraph-image"]);
    expect(og?.images?.[0]).toMatchObject({ width: 1200, height: 630 });
    if (title) {
      expect((meta.title as { absolute: string }).absolute).toBe(title);
    }
  });
});

describe("markup: one main landmark per page", () => {
  it("no page or layout under src/app declares its own main (the site chrome owns it)", () => {
    const offenders = walk(APP_DIR)
      .filter((f) => /\.tsx$/.test(f))
      .filter((f) => /<main[\s>]/.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(ROOT.length + 1));
    expect(offenders).toEqual([]);
  });

  it("/contact rendered inside the site chrome has exactly one main", () => {
    setPathname("/contact");
    const html = renderToStaticMarkup(createElement(SiteChrome, null, ContactPage()));
    expect(html.match(/<main[\s>]/g)).toHaveLength(1);
  });
});

describe("/favicon.ico", () => {
  it("is served by a rewrite to the generated icon, not by a file under that name", async () => {
    const { default: nextConfig } = await import("../../next.config");
    const rules = await nextConfig.rewrites?.();
    expect(Array.isArray(rules)).toBe(true);
    expect(rules).toContainEqual({ source: "/favicon.ico", destination: "/icon" });
    expect(existsSync(join(APP_DIR, "icon.tsx"))).toBe(true);
    expect(existsSync(join(APP_DIR, "favicon.ico"))).toBe(false);
  });

  it("stays outside the middleware matcher", () => {
    const source = readFileSync(join(ROOT, "middleware.ts"), "utf8");
    expect(source).toMatch(/matcher:[\s\S]*favicon\.ico/);
  });
});
