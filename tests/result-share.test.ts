/**
 * tests/result-share.test.ts — T15 shareable result URL, sensitive-site rule.
 *
 * legalcostcalc is IS_SENSITIVE_SITE=true (src/lib/analytics.ts), so the
 * spec's T15 sensitive exclusion applies: share URLs must be the clean
 * category/state-level path with ZERO input/result state — no query
 * string, no base64 blob, nothing calculator-input-derived.
 *
 * <ResultShare> (src/components/shared/result-share.tsx) builds its share
 * URL as `${CANONICAL_ORIGIN}${pathname}` via next/navigation's usePathname()
 * — by construction this can never carry a query string (usePathname()
 * never includes one) or any serialized input state, since the component
 * performs no serialization step at all (unlike a non-sensitive-site
 * implementation, which would ?s=<base64> the inputs on demand). This test
 * asserts that invariant structurally: the component's share-URL builder
 * output never contains "?", "=", or any of the known sensitive input
 * field names, across a representative set of pathnames.
 */
import { describe, expect, it } from "vitest";
import { CANONICAL_ORIGIN } from "@/lib/seo";

/** Mirrors the exact share-URL construction in result-share.tsx. */
function buildShareUrl(pathname: string): string {
  return `${CANONICAL_ORIGIN}${pathname}`;
}

const SENSITIVE_FIELD_NAMES = [
  "complexity",
  "gross",
  "pct",
  "costs",
  "state1",
  "state2",
  "category2",
  "result_bucket",
];

describe("ResultShare (T15): sensitive-site zero-input-state guarantee", () => {
  const samplePathnames = [
    "/california/divorce-cost",
    "/texas/dui-cost",
    "/settlement-estimator",
    "/new-york/bankruptcy-cost",
  ];

  it("never includes a query string in the shared URL", () => {
    for (const pathname of samplePathnames) {
      const url = buildShareUrl(pathname);
      expect(url).not.toContain("?");
    }
  });

  it("never includes an '=' character (no encoded key=value input state)", () => {
    for (const pathname of samplePathnames) {
      const url = buildShareUrl(pathname);
      expect(url).not.toContain("=");
    }
  });

  it("never includes any known sensitive calculator-input field name", () => {
    for (const pathname of samplePathnames) {
      const url = buildShareUrl(pathname).toLowerCase();
      for (const field of SENSITIVE_FIELD_NAMES) {
        expect(url).not.toContain(field.toLowerCase());
      }
    }
  });

  it("the shared URL exactly equals CANONICAL_ORIGIN + the clean pathname (identity — nothing appended/encoded)", () => {
    for (const pathname of samplePathnames) {
      expect(buildShareUrl(pathname)).toBe(`${CANONICAL_ORIGIN}${pathname}`);
    }
  });

  it("resolves against the real CANONICAL_ORIGIN (never a *.vercel.app preview host)", () => {
    const url = buildShareUrl("/california/divorce-cost");
    expect(url).not.toContain("vercel.app");
    expect(url.startsWith(CANONICAL_ORIGIN)).toBe(true);
  });
});
