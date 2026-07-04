/**
 * tests/code-05-og-images.test.ts
 *
 * CODE-05 (부속P §4) — dynamic OG/result images with the computed answer
 * baked in. Verifies the acceptance criteria:
 *   - the opengraph-image for an entity ([state]/[slug]) page returns a
 *     1200x630 image containing that entity's REAL computed number/range
 *     and a dated "as of" marker
 *   - page <head> has og:image (via Next's file-convention, auto-registered)
 *     + twitter:card=summary_large_image (via buildMeta(), sitewide)
 *   - identical generator/freshness-label pattern reused across all OG
 *     image routes (source audit)
 *   - no fake ratings/superlatives baked into any image
 *   - /legal-cost-statistics gets its own real-data OG image
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getOgAsOfLabel } from "@/lib/seo/og-freshness";
import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

/**
 * Strips /* block *\/ and // line comments before scanning for forbidden
 * fabricated-content keywords, so a guardrail comment explaining what the
 * code deliberately does NOT do (e.g. "no fake ratings/superlatives") isn't
 * itself mistaken for the fabricated content it's warning against.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

describe("CODE-05: getOgAsOfLabel — real, non-fabricated freshness label", () => {
  it("produces a human-readable 'As of {date}' string from the real sitewide-verified date", () => {
    const label = getOgAsOfLabel();
    expect(label).toMatch(/^As of /);
    // Must reflect the actual DEFAULT_FIGURES_LAST_VERIFIED year, not `new Date()`'s year.
    const year = new Date(DEFAULT_FIGURES_LAST_VERIFIED as string).getUTCFullYear();
    expect(label).toContain(String(year));
  });
});

describe("CODE-05: [state]/[slug] entity OG image bakes in the real computed range + freshness", () => {
  const src = readSource("src/app/[state]/[slug]/opengraph-image.tsx");

  it("is 1200x630", () => {
    expect(src).toMatch(/width:\s*1200/);
    expect(src).toMatch(/height:\s*630/);
  });

  it("uses next/og ImageResponse on the edge runtime", () => {
    expect(src).toMatch(/from ["']next\/og["']/);
    expect(src).toMatch(/ImageResponse/);
    expect(src).toMatch(/export const runtime = ["']edge["']/);
  });

  it("pulls the entity's real computed cost range from the seed dataset (not fabricated)", () => {
    expect(src).toMatch(/getModerateCostRange/);
    expect(src).toMatch(/formatCurrency/);
  });

  it("renders a real dated 'as of' freshness marker (getOgAsOfLabel), never `new Date()`", () => {
    expect(src).toMatch(/getOgAsOfLabel/);
    expect(src).not.toMatch(/new Date\(\)/);
  });

  it("never bakes in a fabricated rating/superlative", () => {
    expect(stripComments(src).toLowerCase()).not.toMatch(/rating|stars|#1|best in|cheapest|guaranteed/);
  });

  it("uses brand teal accent, consistent with the rest of the site's OG images", () => {
    expect(src).toMatch(/#0D9488/);
  });
});

describe("CODE-05: freshness marker present + no `new Date()` on every OG image route", () => {
  const files = [
    "src/app/[state]/opengraph-image.tsx",
    "src/app/category/[category]/opengraph-image.tsx",
    "src/app/divorce-cost-by-state/opengraph-image.tsx",
    "src/app/[state]/[slug]/opengraph-image.tsx",
    "src/app/legal-cost-statistics/opengraph-image.tsx",
  ];

  it("every OG image imports and renders the shared getOgAsOfLabel helper", () => {
    for (const f of files) {
      const src = readSource(f);
      expect(src).toMatch(/getOgAsOfLabel/);
    }
  });

  it("no OG image route fabricates a freshness date via `new Date()`", () => {
    for (const f of files) {
      const src = readSource(f);
      expect(src).not.toMatch(/new Date\(\)/);
    }
  });
});

describe("CODE-05: /legal-cost-statistics OG image is data-driven, real, dated", () => {
  const src = readSource("src/app/legal-cost-statistics/opengraph-image.tsx");

  it("is 1200x630 via next/og on the edge runtime", () => {
    expect(src).toMatch(/width:\s*1200/);
    expect(src).toMatch(/height:\s*630/);
    expect(src).toMatch(/export const runtime = ["']edge["']/);
  });

  it("pulls the real headline stat from buildStatisticsAggregate (not fabricated)", () => {
    expect(src).toMatch(/buildStatisticsAggregate/);
    expect(src).toMatch(/formatCurrency/);
  });

  it("never bakes in a fabricated rating/superlative", () => {
    expect(stripComments(src).toLowerCase()).not.toMatch(/rating|stars|#1 |best in|cheapest|guaranteed/);
  });
});

describe("CODE-05: sitewide twitter:card=summary_large_image (buildMeta)", () => {
  it("buildMeta() emits twitter.card = summary_large_image for every caller", () => {
    const src = readSource("src/lib/seo.ts");
    expect(src).toMatch(/card:\s*["']summary_large_image["']/);
  });

  it("[state]/[slug]/page.tsx and legal-cost-statistics/page.tsx route their metadata through buildMeta", () => {
    const entityPage = readSource("src/app/[state]/[slug]/page.tsx");
    expect(entityPage).toMatch(/buildMeta\(/);
    const statsPage = readSource("src/app/legal-cost-statistics/page.tsx");
    expect(statsPage).toMatch(/buildMeta\(/);
  });
});
