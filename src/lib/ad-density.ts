/**
 * ad-density.ts — CODE-06 (부속W §5): ad-density ceilings, as code.
 *
 * WHY
 * AdSense's publisher policy forbids "screens with more ads or other paid
 * promotional material than publisher-content". A short calculator page is the
 * easiest place in this portfolio to trip that clause: the result card is small,
 * so one extra unit can outweigh the prose. Ten domains share ONE publisher id
 * (ca-pub-1378312299412437), so a density violation on any one of them is a
 * portfolio-wide risk. These limits therefore live in code with tests, not in a
 * reviewer's memory.
 *
 * WHERE EACH LIMIT IS ENFORCED (deliberate split — measure where the data is real)
 *   - Structural caps (units per route, at most one before the content starts,
 *     spacing from inputs/CTAs) are asserted in unit tests against
 *     server-rendered markup and route sources: `tests/ad-density.test.ts`.
 *   - Ratio limits (reserved ad height vs content height, words of publisher
 *     content per unit) are asserted by `scripts/ad-health-report.mjs` against
 *     LIVE HTML. A unit test cannot see the real content of a data-driven page,
 *     and under-counting content would make the ratio look worse than it is —
 *     a false failure that teaches the team to ignore the gate. The pure math
 *     lives here so both layers compute it identically.
 *
 * NOT A REVENUE KNOB: raising these numbers to compensate for low traffic is
 * the documented policy violation this module prevents (부속W §7 anti-pattern).
 */

/** Hard ceilings. Raising any value requires a policy review, not a refactor. */
export const AD_DENSITY_LIMITS = {
  /** Ad units allowed per route, counting every provider slot. */
  maxUnitsPerRoute: 3,
  /**
   * Units allowed before the publisher content begins. "Above the fold" is
   * approximated by source order rather than a pixel measurement, because
   * source order is what both a crawler and a reviewer with JS disabled see.
   */
  maxUnitsBeforeContent: 1,
  /** Words of publisher prose required per ad unit. 3 units => 1,200+ words. */
  minContentWordsPerUnit: 400,
  /** Reserved ad height as a share of estimated content height. */
  maxReservedHeightRatio: 0.3,
} as const;

/**
 * Reserved (CLS-preventing) height per ad format, in CSS pixels, matching the
 * min-heights the ad wrappers actually declare. Used as the numerator of the
 * height ratio — the reserved box is what pushes content down whether or not a
 * creative fills it.
 */
export const RESERVED_AD_HEIGHT_PX: Record<string, number> = {
  leaderboard: 90,
  banner: 90,
  horizontal: 90,
  rectangle: 250,
  auto: 280,
  responsive: 280,
  fluid: 280,
  vertical: 600,
};

/** Unknown formats bill at the responsive height — the conservative choice. */
export const DEFAULT_RESERVED_AD_HEIGHT_PX = RESERVED_AD_HEIGHT_PX.responsive!;

/**
 * Content-height estimate. Documented approximation, not a measurement: at the
 * 375px mobile viewport these sites target, body copy averages ~11 words per
 * line at a 28px line-height, so one word ≈ 28/11 px of vertical space. Stated
 * as an estimate wherever it is reported.
 */
export const CONTENT_PX_PER_WORD = 28 / 11;

export function estimateContentHeightPx(words: number): number {
  return Math.max(0, words) * CONTENT_PX_PER_WORD;
}

export function reservedHeightPx(formats: readonly string[]): number {
  return formats.reduce(
    (sum, format) =>
      sum + (RESERVED_AD_HEIGHT_PX[format.toLowerCase()] ?? DEFAULT_RESERVED_AD_HEIGHT_PX),
    0,
  );
}

export interface AdDensityInput {
  /** Every ad unit on the route, by format (one entry per unit). */
  unitFormats: readonly string[];
  /** Words of publisher prose on the route, excluding nav/header/footer. */
  contentWords: number;
  /** Units appearing before the first publisher content, by source order. */
  unitsBeforeContent?: number;
}

export interface AdDensityResult {
  unitCount: number;
  reservedPx: number;
  /** Estimated, per CONTENT_PX_PER_WORD — never presented as a measurement. */
  estimatedContentPx: number;
  heightRatio: number;
  wordsPerUnit: number;
  violations: string[];
  withinLimits: boolean;
}

/**
 * Evaluates one route against every limit. Zero ad units is always compliant —
 * a page with no inventory cannot be ad-heavy, and the slot-env guards render
 * nothing until a numeric slot id exists (CODE-01).
 */
export function evaluateAdDensity(input: AdDensityInput): AdDensityResult {
  const unitCount = input.unitFormats.length;
  const reservedPx = reservedHeightPx(input.unitFormats);
  const estimatedContentPx = estimateContentHeightPx(input.contentWords);
  const heightRatio = estimatedContentPx > 0 ? reservedPx / estimatedContentPx : unitCount > 0 ? Infinity : 0;
  const wordsPerUnit = unitCount > 0 ? input.contentWords / unitCount : Infinity;
  const unitsBeforeContent = input.unitsBeforeContent ?? 0;

  const violations: string[] = [];
  if (unitCount > AD_DENSITY_LIMITS.maxUnitsPerRoute) {
    violations.push(
      `${unitCount} ad units exceeds the per-route cap of ${AD_DENSITY_LIMITS.maxUnitsPerRoute}`,
    );
  }
  if (unitsBeforeContent > AD_DENSITY_LIMITS.maxUnitsBeforeContent) {
    violations.push(
      `${unitsBeforeContent} ad units precede the publisher content (cap ${AD_DENSITY_LIMITS.maxUnitsBeforeContent})`,
    );
  }
  if (unitCount > 0 && wordsPerUnit < AD_DENSITY_LIMITS.minContentWordsPerUnit) {
    violations.push(
      `${Math.round(wordsPerUnit)} words per ad unit is below the floor of ${AD_DENSITY_LIMITS.minContentWordsPerUnit}`,
    );
  }
  if (unitCount > 0 && heightRatio > AD_DENSITY_LIMITS.maxReservedHeightRatio) {
    violations.push(
      `reserved ad height is ${(heightRatio * 100).toFixed(1)}% of estimated content height (cap ${(AD_DENSITY_LIMITS.maxReservedHeightRatio * 100).toFixed(0)}%)`,
    );
  }

  return {
    unitCount,
    reservedPx,
    estimatedContentPx,
    heightRatio,
    wordsPerUnit,
    violations,
    withinLimits: violations.length === 0,
  };
}

/**
 * Counts ad-entry-point elements in a route's SOURCE. Entry points are the
 * components that ultimately render an `<ins class="adsbygoogle">`; counting
 * them (rather than `<ins>` itself) is what makes the cap checkable without
 * rendering a server component that needs data.
 *
 * Comments are stripped first so the T13 explanatory comments in
 * `src/app/[state]/[slug]/page.tsx` — which mention `<AdProvider>` precisely to
 * record that it was REMOVED — are not miscounted as placements.
 */
export const AD_ENTRY_POINTS = ["AdProvider", "AdUnit", "DisplaySlot", "ResultMonetization"] as const;

export function countAdEntryPoints(source: string, entryPoints: readonly string[] = AD_ENTRY_POINTS): number {
  const withoutComments = source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/^\s*\/\/.*$/gm, " ");
  let count = 0;
  for (const name of entryPoints) {
    const matches = withoutComments.match(new RegExp(`<${name}\\b`, "g"));
    count += matches ? matches.length : 0;
  }
  return count;
}
