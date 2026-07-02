/**
 * Tests for src/lib/seo.ts — T10 title/meta standardization.
 *
 * Asserts buildMeta()/fitTitle() produce titles in the 50-60 char range with
 * the primary keyword in the first 30 chars, over the FULL route/dataset
 * matrix (all 408 state x category combinations) — the spec's explicit
 * "build-time assertion over the route/dataset matrix" acceptance criterion.
 */
import { describe, expect, it } from "vitest";
import { buildMeta, fitTitle, CANONICAL_ORIGIN } from "@/lib/seo";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";

const MIN_LEN = 50;
const MAX_LEN = 60;

describe("seo: fitTitle() over the full 408-page matrix", () => {
  it("every (state, category) title lands in [50,60] chars", () => {
    const outOfRange: string[] = [];
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const core = `${cat.displayName} Cost in ${state.name}`;
        const title = fitTitle(core, 2026);
        if (title.length < MIN_LEN || title.length > MAX_LEN) {
          outOfRange.push(`${title.length}: ${title}`);
        }
      }
    }
    expect(outOfRange).toEqual([]);
  });

  it("every title has its primary keyword (category name) within the first 30 chars", () => {
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const core = `${cat.displayName} Cost in ${state.name}`;
        const title = fitTitle(core, 2026);
        const firstWord = cat.displayName.split(/[\s/]/)[0].toLowerCase();
        expect(title.slice(0, 30).toLowerCase()).toContain(firstWord);
      }
    }
  });

  it("every title starts with the exact keyword-first core phrase", () => {
    for (const state of STATES) {
      for (const cat of CATEGORIES) {
        const core = `${cat.displayName} Cost in ${state.name}`;
        const title = fitTitle(core, 2026);
        expect(title.startsWith(core)).toBe(true);
      }
    }
  });
});

describe("seo: buildMeta()", () => {
  it("sets alternates.canonical to the site-relative path on a dynamic route", () => {
    const meta = buildMeta({
      title: "Divorce Cost in California",
      description: "Test description.",
      path: "/california/divorce-cost",
    });
    expect(meta.alternates?.canonical).toBe("/california/divorce-cost");
  });

  it("canonical resolves against CANONICAL_ORIGIN, never a *.vercel.app host", () => {
    expect(CANONICAL_ORIGIN).not.toMatch(/vercel\.app/);
    const meta = buildMeta({
      title: "Divorce Cost in California",
      description: "Test description.",
      path: "/california/divorce-cost",
    });
    expect(String((meta.openGraph as { url?: string })?.url)).not.toMatch(/vercel\.app/);
    expect(String((meta.openGraph as { url?: string })?.url)).toBe(
      `${CANONICAL_ORIGIN}/california/divorce-cost`,
    );
  });

  it("skipFit preserves the title verbatim", () => {
    const meta = buildMeta({
      title: "Contact Us — Questions, Corrections & Feedback",
      description: "Test description.",
      path: "/contact",
      skipFit: true,
    });
    expect(meta.title).toBe("Contact Us — Questions, Corrections & Feedback");
  });

  it("applies the robots override when provided (T09 thin-page gate), merged with K09's max-image-preview:large", () => {
    const meta = buildMeta({
      title: "Divorce Cost in California",
      description: "Test description.",
      path: "/california/divorce-cost",
      robots: { index: false, follow: true },
    });
    // K09 — buildMeta() always injects max-image-preview:large into any
    // explicit robots override it emits (Metadata.robots does not deep-merge
    // with the root layout across route segments, so an override without
    // this key would silently drop Discover-eligibility on that page).
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      "max-image-preview": "large",
    });
  });

  it("lets an explicit max-image-preview override win over K09's default (caller intent takes precedence)", () => {
    const meta = buildMeta({
      title: "Divorce Cost in California",
      description: "Test description.",
      path: "/california/divorce-cost",
      robots: { index: false, follow: true, "max-image-preview": "standard" },
    });
    expect(meta.robots).toEqual({
      index: false,
      follow: true,
      "max-image-preview": "standard",
    });
  });

  it("omits robots override by default (indexable pages get no explicit override)", () => {
    const meta = buildMeta({
      title: "Divorce Cost in California",
      description: "Test description.",
      path: "/california/divorce-cost",
    });
    expect(meta.robots).toBeUndefined();
  });
});
