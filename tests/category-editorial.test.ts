/**
 * tests/category-editorial.test.ts
 *
 * K01 — on-page editorial depth for indexable /[state]/[slug] calculator
 * pages: "How this calculator works" (per-CATEGORY, entity-level), a WORKED
 * EXAMPLE interpolated with the page's own real per-state cost data, and a
 * visible (rendered-text, not JSON-LD-only) FAQ section of 4-6 questions.
 *
 * Invariants under test:
 *   - Every category has distinct costFormationNotes (no noun-swapped
 *     boilerplate — each category's text differs from every other's).
 *   - CategoryEditorial renders real per-state figures pulled straight from
 *     costs.json (via the same LegalCostData shape the page already builds)
 *     — never invented numbers.
 *   - Rendered output for representative (state, category) pairs is
 *     >= 400 words (spec's word-count build assertion).
 *   - FAQ text is rendered as visible <dt>/<dd> text, not just JSON-LD.
 *   - No advice-verb / UPL-risk language introduced by the new copy.
 *   - Component renders nothing when there is no real data to interpolate
 *     (no fabrication fallback).
 */
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CategoryEditorial } from "@/components/seo/category-editorial";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import costsSeed from "@/data/seed/costs.json";
import type { LegalCostData, Complexity } from "@/lib/types";
import { formatCurrency } from "@/lib/utils/format";

interface SeedRow {
  category: string;
  state_code: string;
  complexity: string;
  cost_low: number;
  cost_median: number;
  cost_high: number;
  hourly_rate_low: number | null;
  hourly_rate_median: number | null;
  hourly_rate_high: number | null;
  typical_duration: string | null;
  common_fees: string[] | null;
  sources: string[] | null;
}

const SEED_ROWS = costsSeed as SeedRow[];

function seedRowToLegalCostData(row: SeedRow): LegalCostData {
  return {
    id: `${row.state_code}-${row.category}-${row.complexity}`,
    category: row.category,
    stateCode: row.state_code,
    complexity: row.complexity as Complexity,
    costRange: { low: row.cost_low, median: row.cost_median, high: row.cost_high },
    hourlyRate: {
      low: row.hourly_rate_low ?? 0,
      median: row.hourly_rate_median ?? 0,
      high: row.hourly_rate_high ?? 0,
    },
    contingencyFee: null,
    typicalDuration: row.typical_duration ?? "Varies",
    commonFees: row.common_fees ?? [],
    sources: row.sources ?? [],
    lastVerifiedAt: "2026-06-29",
  };
}

function getCostsFor(stateCode: string, categorySlug: string): LegalCostData[] {
  return SEED_ROWS.filter((r) => r.state_code === stateCode && r.category === categorySlug).map(
    seedRowToLegalCostData,
  );
}

function buildFaqQuestions(categorySlug: string, stateName: string) {
  const categoryInfo = CATEGORY_MAP.get(categorySlug)!;
  return [
    {
      question: `How much does a ${categoryInfo.displayName.toLowerCase()} cost in ${stateName}?`,
      answer: `The average cost ranges widely based on complexity in ${stateName}.`,
    },
    {
      question: `How much does a ${categoryInfo.displayName.toLowerCase()} lawyer charge per hour in ${stateName}?`,
      answer: `Hourly rates vary by attorney experience in ${stateName}.`,
    },
    {
      question: `How long does a ${categoryInfo.displayName.toLowerCase()} take in ${stateName}?`,
      answer: `Duration depends on case complexity in ${stateName}.`,
    },
    {
      question: `What are common ${categoryInfo.displayName.toLowerCase()} fees in ${stateName}?`,
      answer: `Common fees include filing and service costs in ${stateName}.`,
    },
    ...(categoryInfo.faqTemplates ?? []).map((t) => ({
      question: t.questionTemplate.replace(/\{state\}/g, stateName),
      answer: t.answerTemplate.replace(/\{state\}/g, stateName),
    })),
  ];
}

function countWords(html: string): number {
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length === 0 ? 0 : text.split(" ").length;
}

const ADVICE_VERB_PATTERNS = [
  /you should/i,
  /we recommend/i,
  /you need to/i,
  /you must file/i,
  /best (attorney|lawyer|choice)/i,
  /guaranteed/i,
  /will win/i,
];

describe("category-editorial: per-category costFormationNotes are entity-level, not boilerplate", () => {
  it("every category defines costFormationNotes", () => {
    for (const cat of CATEGORIES) {
      expect(cat.costFormationNotes).toBeDefined();
      expect(cat.costFormationNotes!.length).toBeGreaterThan(0);
    }
  });

  it("no two categories share the same costFormationNotes text (no noun-swapped template)", () => {
    const allNotes = CATEGORIES.map((c) => (c.costFormationNotes ?? []).join(" "));
    const unique = new Set(allNotes);
    expect(unique.size).toBe(CATEGORIES.length);
  });

  it("each category's notes reference concepts specific to that practice area", () => {
    const mustContain: Record<string, RegExp> = {
      divorce: /custody|alimony|mediation/i,
      dui: /BAC|ignition interlock|alcohol education/i,
      "personal-injury": /contingency|settlement|expert witness/i,
      bankruptcy: /Chapter 7|Chapter 13|credit counseling/i,
      "real-estate": /title|closing|appraisal/i,
      "estate-planning": /probate|will|trust/i,
      "criminal-defense": /misdemeanor|felony|plea/i,
      immigration: /USCIS|petition|visa|green card/i,
    };
    for (const cat of CATEGORIES) {
      const text = (cat.costFormationNotes ?? []).join(" ");
      const pattern = mustContain[cat.slug];
      expect(pattern, `no pattern defined for ${cat.slug}`).toBeDefined();
      expect(text).toMatch(pattern);
    }
  });
});

describe("category-editorial: renders real per-state figures, no fabrication", () => {
  it("worked example figures match costs.json exactly for a sample of (state, category) pairs", () => {
    const samples: [string, string][] = [
      ["california", "divorce"],
      ["texas", "dui"],
      ["new-york", "personal-injury"],
      ["florida", "bankruptcy"],
      ["wyoming", "immigration"],
    ];

    for (const [stateSlug, categorySlug] of samples) {
      const stateInfo = STATE_BY_SLUG.get(stateSlug)!;
      const categoryInfo = CATEGORY_MAP.get(categorySlug)!;
      const costs = getCostsFor(stateInfo.code, categorySlug);
      const moderate = costs.find((c) => c.complexity === "moderate");
      if (!moderate) continue;

      const html = renderToStaticMarkup(
        createElement(CategoryEditorial, {
          categoryInfo,
          stateInfo,
          costs,
          faqQuestions: buildFaqQuestions(categorySlug, stateInfo.name),
        }),
      );

      expect(html).toContain(formatCurrency(moderate.costRange.median));
      expect(html).toContain(formatCurrency(moderate.costRange.low));
      expect(html).toContain(formatCurrency(moderate.costRange.high));
    }
  });

  it("renders nothing (no fabricated section) when there is no cost data and no notes", () => {
    const stateInfo = STATE_BY_SLUG.get("california")!;
    const emptyCategory = { ...CATEGORY_MAP.get("divorce")!, costFormationNotes: [] };
    const html = renderToStaticMarkup(
      createElement(CategoryEditorial, {
        categoryInfo: emptyCategory,
        stateInfo,
        costs: [],
        faqQuestions: [],
      }),
    );
    expect(html).toBe("");
  });
});

describe("category-editorial: visible FAQ text (not JSON-LD-only)", () => {
  it("renders FAQ questions and answers as visible <dt>/<dd> text", () => {
    const stateInfo = STATE_BY_SLUG.get("california")!;
    const categoryInfo = CATEGORY_MAP.get("divorce")!;
    const costs = getCostsFor(stateInfo.code, "divorce");
    const faqQuestions = buildFaqQuestions("divorce", stateInfo.name);

    const html = renderToStaticMarkup(
      createElement(CategoryEditorial, { categoryInfo, stateInfo, costs, faqQuestions }),
    );

    expect(html).toContain("<dt");
    expect(html).toContain("<dd");
    for (const faq of faqQuestions) {
      expect(html).toContain(faq.question);
    }
    // 4-6 questions per the spec (this category has 4 base + 2 category-specific = 6).
    expect(faqQuestions.length).toBeGreaterThanOrEqual(4);
    expect(faqQuestions.length).toBeLessThanOrEqual(6);
  });
});

describe("category-editorial: word count >= 400 on representative pages", () => {
  it("every category, sampled on one representative state, renders >= 400 words", () => {
    const stateInfo = STATE_BY_SLUG.get("california")!;

    for (const categoryInfo of CATEGORIES) {
      const costs = getCostsFor(stateInfo.code, categoryInfo.slug);
      const faqQuestions = buildFaqQuestions(categoryInfo.slug, stateInfo.name);
      const html = renderToStaticMarkup(
        createElement(CategoryEditorial, { categoryInfo, stateInfo, costs, faqQuestions }),
      );
      const words = countWords(html);
      expect(words, `${categoryInfo.slug} on California rendered only ${words} words`).toBeGreaterThanOrEqual(
        400,
      );
    }
  });

  it("a low-population state (fewer common fees / shorter data) still clears 400 words", () => {
    const stateInfo = STATE_BY_SLUG.get("wyoming")!;
    const categoryInfo = CATEGORY_MAP.get("divorce")!;
    const costs = getCostsFor(stateInfo.code, "divorce");
    const faqQuestions = buildFaqQuestions("divorce", stateInfo.name);
    const html = renderToStaticMarkup(
      createElement(CategoryEditorial, { categoryInfo, stateInfo, costs, faqQuestions }),
    );
    expect(countWords(html)).toBeGreaterThanOrEqual(400);
  });
});

describe("category-editorial: UPL-safe copy", () => {
  it("contains no advice-verb / outcome-prediction language across all categories", () => {
    const stateInfo = STATE_BY_SLUG.get("california")!;
    for (const categoryInfo of CATEGORIES) {
      const costs = getCostsFor(stateInfo.code, categoryInfo.slug);
      const faqQuestions = buildFaqQuestions(categoryInfo.slug, stateInfo.name);
      const html = renderToStaticMarkup(
        createElement(CategoryEditorial, { categoryInfo, stateInfo, costs, faqQuestions }),
      );
      for (const pattern of ADVICE_VERB_PATTERNS) {
        expect(html, `${categoryInfo.slug} matched banned pattern ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

describe("category-editorial: tool-intent H2s", () => {
  it("uses distinct, descriptive H2 headings rather than generic labels", () => {
    const stateInfo = STATE_BY_SLUG.get("california")!;
    const categoryInfo = CATEGORY_MAP.get("divorce")!;
    const costs = getCostsFor(stateInfo.code, "divorce");
    const faqQuestions = buildFaqQuestions("divorce", stateInfo.name);
    const html = renderToStaticMarkup(
      createElement(CategoryEditorial, { categoryInfo, stateInfo, costs, faqQuestions }),
    );
    expect(html).toContain("How Divorce Costs Work");
    expect(html).toContain("Worked Example: Divorce in California");
    expect(html).toContain("Frequently Asked Questions");
  });
});

describe("category-editorial: coverage sanity — all 51 states x 8 categories", () => {
  it("every real (state, category) pair with a moderate row renders without throwing", () => {
    let rendered = 0;
    for (const state of STATES) {
      for (const categoryInfo of CATEGORIES) {
        const costs = getCostsFor(state.code, categoryInfo.slug);
        if (costs.length === 0) continue;
        const faqQuestions = buildFaqQuestions(categoryInfo.slug, state.name);
        expect(() =>
          renderToStaticMarkup(
            createElement(CategoryEditorial, { categoryInfo, stateInfo: state, costs, faqQuestions }),
          ),
        ).not.toThrow();
        rendered++;
      }
    }
    expect(rendered).toBeGreaterThan(0);
  });
});
