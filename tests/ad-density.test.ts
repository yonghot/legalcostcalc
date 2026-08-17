/**
 * tests/ad-density.test.ts — CODE-06 (부속W §5) structural ad-density caps.
 *
 * Complements tests/ad-proximity.test.ts (K05, which guards accidental-click
 * spacing) with the ceilings AdSense's publisher policy actually turns on:
 * "screens with more ads than publisher-content".
 *
 * Enforced here (structure, from real sources / rendered markup):
 *   1. No route declares more than AD_DENSITY_LIMITS.maxUnitsPerRoute units.
 *   2. At most one unit precedes the publisher content, by source order.
 *   3. Ad components never read navigator.userAgent — differentiating what a
 *      visitor sees by user agent is cloaking, and with one publisher id shared
 *      across ten domains it is an existential risk, so it is pinned by a test
 *      rather than a comment (also CODE-07 acceptance item 3).
 *   4. The density math itself behaves (limits are real, not decorative).
 *
 * Ratio limits (reserved height vs content height, words per unit) are asserted
 * against LIVE HTML by scripts/ad-health-report.mjs — see ad-density.ts for why
 * that split is deliberate.
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  AD_DENSITY_LIMITS,
  AD_ENTRY_POINTS,
  countAdEntryPoints,
  evaluateAdDensity,
  reservedHeightPx,
  estimateContentHeightPx,
} from "@/lib/ad-density";

const ROOT = path.resolve(__dirname, "..");
const APP_DIR = path.join(ROOT, "src", "app");

function collectRouteFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      collectRouteFiles(full, out);
    } else if (entry === "page.tsx" || entry === "layout.tsx") {
      out.push(full);
    }
  }
  return out;
}

const ROUTE_FILES = collectRouteFiles(APP_DIR);

describe("CODE-06 — ad density ceilings", () => {
  it("finds routes to audit (guards against the audit silently covering nothing)", () => {
    expect(ROUTE_FILES.length).toBeGreaterThan(0);
  });

  it.each(ROUTE_FILES.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s declares at most %o ad units",
    (_label, file) => {
      const source = readFileSync(file, "utf8");
      const units = countAdEntryPoints(source);
      expect(units).toBeLessThanOrEqual(AD_DENSITY_LIMITS.maxUnitsPerRoute);
    },
  );

  it("no route puts more than one ad unit ahead of its first heading", () => {
    for (const file of ROUTE_FILES) {
      const source = readFileSync(file, "utf8")
        .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");
      // The first <h1>/<h2> (or a heading component) marks where publisher
      // content starts. Anything before it renders above the content.
      const headingAt = source.search(/<h1\b|<h2\b|<article\b|<CategoryEditorial\b|<StateCostAnalysis\b/);
      if (headingAt === -1) continue;
      const before = countAdEntryPoints(source.slice(0, headingAt));
      expect(
        before,
        `${path.relative(ROOT, file)} renders ${before} ad units before its first content heading`,
      ).toBeLessThanOrEqual(AD_DENSITY_LIMITS.maxUnitsBeforeContent);
    }
  });

  it("ad components never branch on user agent (cloaking guard)", () => {
    const adSources = [
      "src/components/ads/ad-unit.tsx",
      "src/components/monetization/AdProvider.tsx",
      "src/lib/ad-slots.ts",
      "src/lib/ad-density.ts",
    ];
    for (const rel of adSources) {
      const source = readFileSync(path.join(ROOT, rel), "utf8");
      // Prose mentioning the rule is fine; reading the value is not.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/^\s*\/\/.*$/gm, " ");
      expect(code, `${rel} must not read navigator.userAgent`).not.toMatch(/navigator\s*\.\s*userAgent/);
      expect(code, `${rel} must not read a user-agent header`).not.toMatch(/headers\(\)[\s\S]{0,40}user-agent/i);
    }
  });

  it("entry-point counting ignores comments that merely mention the components", () => {
    const source = `
      {/* T13: the standalone <AdProvider> was removed on purpose */}
      // <AdUnit /> used to live here
      /* <DisplaySlot /> too */
      <AdProvider />
    `;
    expect(countAdEntryPoints(source)).toBe(1);
  });

  it("counts every entry-point alias", () => {
    const source = AD_ENTRY_POINTS.map((n) => `<${n} />`).join("\n");
    expect(countAdEntryPoints(source)).toBe(AD_ENTRY_POINTS.length);
  });

  describe("density math", () => {
    it("passes a long page carrying one unit", () => {
      const result = evaluateAdDensity({ unitFormats: ["rectangle"], contentWords: 1900 });
      expect(result.withinLimits).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it("flags too many units", () => {
      const result = evaluateAdDensity({
        unitFormats: ["rectangle", "rectangle", "rectangle", "leaderboard"],
        contentWords: 5000,
      });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.join(" ")).toMatch(/exceeds the per-route cap/);
    });

    it("flags a thin page carrying an ad", () => {
      const result = evaluateAdDensity({ unitFormats: ["rectangle"], contentWords: 300 });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.join(" ")).toMatch(/words per ad unit/);
    });

    it("flags reserved height dominating the page", () => {
      // 3 rectangles = 750px reserved; 1,200 words ≈ 3,054px estimated content
      // => 24.6% (passes). Shrink the content and the ratio breaks the cap.
      const ok = evaluateAdDensity({
        unitFormats: ["rectangle", "rectangle", "rectangle"],
        contentWords: 1200,
      });
      expect(ok.withinLimits).toBe(true);
      const bad = evaluateAdDensity({
        unitFormats: ["vertical", "vertical"],
        contentWords: 900,
      });
      expect(bad.withinLimits).toBe(false);
      expect(bad.violations.join(" ")).toMatch(/reserved ad height/);
    });

    it("flags units stacked ahead of the content", () => {
      const result = evaluateAdDensity({
        unitFormats: ["leaderboard", "rectangle"],
        contentWords: 2000,
        unitsBeforeContent: 2,
      });
      expect(result.withinLimits).toBe(false);
      expect(result.violations.join(" ")).toMatch(/precede the publisher content/);
    });

    it("treats a page with no inventory as compliant", () => {
      const result = evaluateAdDensity({ unitFormats: [], contentWords: 0 });
      expect(result.withinLimits).toBe(true);
      expect(result.wordsPerUnit).toBe(Infinity);
    });

    it("bills unknown formats at the conservative responsive height", () => {
      expect(reservedHeightPx(["not-a-format"])).toBe(reservedHeightPx(["responsive"]));
    });

    it("estimates content height monotonically", () => {
      expect(estimateContentHeightPx(1000)).toBeGreaterThan(estimateContentHeightPx(500));
      expect(estimateContentHeightPx(0)).toBe(0);
    });
  });
});
