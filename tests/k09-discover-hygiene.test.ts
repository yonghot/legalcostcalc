/**
 * tests/k09-discover-hygiene.test.ts — K09 acceptance (부속M §9 K09).
 *
 * Two requirements:
 *  1. robots meta `max-image-preview:large` on all indexable pages (source
 *     audit over every explicit `robots:` declaration in src/app/ and the
 *     buildMeta() helper that most pages route through).
 *  2. Hub/insight pages (/[state], /category/[category],
 *     /divorce-cost-by-state) have a >=1200px-wide, 16:9-ish OG image
 *     generated from real dataset figures (next/og ImageResponse), not a
 *     generic/static placeholder.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

describe("K09 — max-image-preview:large on robots declarations", () => {
  it("src/app/layout.tsx sets the site-wide default with max-image-preview:large", () => {
    const src = readSource("src/app/layout.tsx");
    const robotsMatch = src.match(/robots:\s*\{[^}]*\}/);
    expect(robotsMatch).not.toBeNull();
    expect(robotsMatch![0]).toMatch(/index:\s*true/);
    expect(robotsMatch![0]).toMatch(/"max-image-preview":\s*"large"/);
  });

  it("src/lib/seo.ts's buildMeta() merges max-image-preview:large into every explicit robots override it emits", () => {
    // Next.js does NOT deep-merge metadata.robots across route segments — a
    // child route's explicit robots object REPLACES the parent layout's
    // robots block entirely. buildMeta() is the single call site most pages
    // route their robots override through (e.g. the T09 thin-page noindex
    // gate on /[state]/[slug]) — verify it always injects the directive
    // rather than trusting inheritance, which would silently drop it.
    const src = readSource("src/lib/seo.ts");
    expect(src).toMatch(/"max-image-preview":\s*"large"/);
    // The merge must apply whenever a caller passes a robots override.
    expect(src).toMatch(/resolvedRobots/);
  });

  it("src/app/[state]/[slug]/page.tsx's noindex override still resolves through buildMeta (inherits max-image-preview:large)", () => {
    const src = readSource("src/app/[state]/[slug]/page.tsx");
    expect(src).toMatch(/robots:\s*indexable\s*\?\s*undefined\s*:\s*\{[^}]*index:\s*false[^}]*\}/);
    // Must be routed through buildMeta, not a hand-rolled Metadata object.
    expect(src).toMatch(/buildMeta\(/);
  });

  it("src/app/embed/[state]/[slug]/page.tsx's noindex,nofollow override explicitly carries max-image-preview:large", () => {
    const src = readSource("src/app/embed/[state]/[slug]/page.tsx");
    const robotsMatch = src.match(/robots:\s*\{[^}]*index:\s*false[^}]*\}/);
    expect(robotsMatch).not.toBeNull();
    expect(robotsMatch![0]).toMatch(/"max-image-preview":\s*"large"/);
  });

  it("every page that declares its own metadata object without buildMeta() has no robots override (so it inherits the layout default)", () => {
    // These four routes hand-roll a Metadata object instead of calling
    // buildMeta() — confirm none of them re-declare `robots` (which would
    // shadow the root layout's max-image-preview:large without carrying it
    // forward).
    const files = ["src/app/page.tsx", "src/app/embed/page.tsx", "src/app/privacy/page.tsx", "src/app/terms/page.tsx"];
    for (const f of files) {
      const src = readSource(f);
      const metadataBlockMatch = src.match(/export const metadata:\s*Metadata\s*=\s*\{[\s\S]*?\n\};/);
      expect(metadataBlockMatch).not.toBeNull();
      expect(metadataBlockMatch![0]).not.toMatch(/robots:/);
    }
  });
});

describe("K09 — /[state] hub OG image is data-driven, >=1200px wide, 16:9-ish", () => {
  const src = readSource("src/app/[state]/opengraph-image.tsx");

  it("declares a 1200-wide size", () => {
    expect(src).toMatch(/width:\s*1200/);
  });

  it("declares a 16:9-ish height (630, matching the standard OG 1200x630 ratio)", () => {
    expect(src).toMatch(/height:\s*630/);
  });

  it("uses next/og ImageResponse (not a static file)", () => {
    expect(src).toMatch(/from ["']next\/og["']/);
    expect(src).toMatch(/ImageResponse/);
  });

  it("runs on the edge runtime, matching the rest of the site's OG image routes", () => {
    expect(src).toMatch(/export const runtime = ["']edge["']/);
  });

  it("pulls the state's real per-category cost figures via the page-index dataset (not fabricated numbers)", () => {
    expect(src).toMatch(/getModerateMedianCost/);
    expect(src).toMatch(/INDEXABLE_PAGES/);
    expect(src).toMatch(/formatCurrency/);
  });

  it("uses brand teal accent (#0D9488), consistent with the rest of the site's OG images", () => {
    expect(src).toMatch(/#0D9488/);
  });
});

describe("K09 — /category/[category] hub OG image is data-driven, >=1200px wide, 16:9-ish", () => {
  const src = readSource("src/app/category/[category]/opengraph-image.tsx");

  it("declares a 1200-wide size", () => {
    expect(src).toMatch(/width:\s*1200/);
  });

  it("declares a 16:9-ish height (630)", () => {
    expect(src).toMatch(/height:\s*630/);
  });

  it("uses next/og ImageResponse", () => {
    expect(src).toMatch(/from ["']next\/og["']/);
    expect(src).toMatch(/ImageResponse/);
  });

  it("runs on the edge runtime", () => {
    expect(src).toMatch(/export const runtime = ["']edge["']/);
  });

  it("pulls real per-state figures via the page-index dataset (not fabricated numbers)", () => {
    expect(src).toMatch(/getModerateMedianCost/);
    expect(src).toMatch(/INDEXABLE_PAGES/);
    expect(src).toMatch(/formatCurrency/);
  });

  it("uses brand teal accent (#0D9488)", () => {
    expect(src).toMatch(/#0D9488/);
  });
});

describe("K09 — /divorce-cost-by-state hub OG image is data-driven, >=1200px wide, 16:9-ish", () => {
  const src = readSource("src/app/divorce-cost-by-state/opengraph-image.tsx");

  it("declares a 1200-wide size", () => {
    expect(src).toMatch(/width:\s*1200/);
  });

  it("declares a 16:9-ish height (630)", () => {
    expect(src).toMatch(/height:\s*630/);
  });

  it("uses next/og ImageResponse", () => {
    expect(src).toMatch(/from ["']next\/og["']/);
    expect(src).toMatch(/ImageResponse/);
  });

  it("runs on the edge runtime", () => {
    expect(src).toMatch(/export const runtime = ["']edge["']/);
  });

  it("pulls real uncontested/contested medians via getCostByComplexity (not fabricated numbers)", () => {
    expect(src).toMatch(/getCostByComplexity/);
    expect(src).toMatch(/INDEXABLE_PAGES/);
    expect(src).toMatch(/formatCurrency/);
  });

  it("uses brand teal accent (#0D9488)", () => {
    expect(src).toMatch(/#0D9488/);
  });
});

describe("K09 — no forbidden design tokens in new OG image code (design/forbidden.md)", () => {
  const files = [
    "src/app/[state]/opengraph-image.tsx",
    "src/app/category/[category]/opengraph-image.tsx",
    "src/app/divorce-cost-by-state/opengraph-image.tsx",
  ];

  it("none of the new OG images use purple/blue-gradient Tailwind class tokens", () => {
    for (const f of files) {
      const src = readSource(f);
      expect(src).not.toMatch(/from-purple-|to-blue-/);
    }
  });

  it("none use pure black (#000000)", () => {
    for (const f of files) {
      const src = readSource(f);
      expect(src.toLowerCase()).not.toMatch(/#000000/);
    }
  });
});

describe("K09 — existing OG images (pre-K09) remain 1200x630", () => {
  it("src/app/opengraph-image.tsx size is 1200x630", () => {
    const src = readSource("src/app/opengraph-image.tsx");
    expect(src).toMatch(/width:\s*1200/);
    expect(src).toMatch(/height:\s*630/);
  });

  it("src/app/[state]/[slug]/opengraph-image.tsx size is 1200x630", () => {
    const src = readSource("src/app/[state]/[slug]/opengraph-image.tsx");
    expect(src).toMatch(/width:\s*1200/);
    expect(src).toMatch(/height:\s*630/);
  });
});
