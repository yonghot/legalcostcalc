/**
 * tests/calculator-presets.test.ts — U-01 preset one-click scenarios
 * (부속U §4/§5).
 *
 * Covers:
 *   1. Dataset/engine equality — every preset in
 *      src/lib/constants/presets.ts resolves to a REAL row in
 *      src/data/seed/costs.json (never a fabricated/rounded value).
 *   2. Copy hygiene — neutral "Example: ..." framing, no advice verbs
 *      (YMYL rule, design/tone.md "Words" section).
 *   3. Render — the preset buttons actually render, above-fold, in
 *      CostCalculator's pre-calculation markup (K05 extension: still zero
 *      ad markers anywhere near them, since no ad slot exists in this
 *      component before a result is computed).
 *   4. TermsGate non-bypass — source-level audit that the preset click
 *      handler never touches consent state directly and only ever computes
 *      through the same termsGate.hasConsented-gated path a manual click
 *      uses.
 */
import { describe, it, expect, vi } from "vitest";
import { createElement } from "react";
import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";
import rawCosts from "../src/data/seed/costs.json";
import { CALCULATOR_PRESETS } from "@/lib/constants/presets";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  notFound: () => {
    throw new Error("notFound() must not be reached in this test");
  },
}));

vi.mock("next/link", async () => {
  const { createElement: h } = await import("react");
  return {
    default: ({
      href,
      children,
      className,
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
    }) => h("a", { href, className }, children),
  };
});

import { CostCalculator } from "@/components/calculator/cost-calculator";

interface CostCell {
  category: string;
  state_code: string;
  complexity: string;
}

const costs = rawCosts as CostCell[];

function readSource(relPath: string): string {
  return readFileSync(path.resolve(__dirname, "..", relPath), "utf8");
}

describe("U-01 — CALCULATOR_PRESETS dataset/engine equality", () => {
  it("has 2-3 presets (부속U §4 acceptance: '2~3개')", () => {
    expect(CALCULATOR_PRESETS.length).toBeGreaterThanOrEqual(2);
    expect(CALCULATOR_PRESETS.length).toBeLessThanOrEqual(3);
  });

  it("every preset {category, stateCode, complexity} resolves to a real costs.json row", () => {
    for (const preset of CALCULATOR_PRESETS) {
      const match = costs.find(
        (c) =>
          c.category === preset.category &&
          c.state_code === preset.stateCode &&
          c.complexity === preset.complexity,
      );
      expect(
        match,
        `preset "${preset.id}" (${preset.category}/${preset.stateCode}/${preset.complexity}) must exist in costs.json`,
      ).toBeDefined();
    }
  });

  it("includes the three 부속U §5 scenarios for legalcostcalc: CA divorce simple, NY estate-planning simple, TX dui moderate", () => {
    const has = (category: string, stateCode: string, complexity: string) =>
      CALCULATOR_PRESETS.some(
        (p) => p.category === category && p.stateCode === stateCode && p.complexity === complexity,
      );
    expect(has("divorce", "CA", "simple")).toBe(true);
    expect(has("estate-planning", "NY", "simple")).toBe(true);
    expect(has("dui", "TX", "moderate")).toBe(true);
  });

  it("preset ids are unique", () => {
    const ids = CALCULATOR_PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("U-01 — preset label copy hygiene (YMYL: neutral, non-advisory)", () => {
  const ADVICE_VERB_PATTERN = /\b(should|must|need to|recommend|guarantee(?:d)?|best|cheapest)\b/i;

  it("every label starts with the neutral 'Example:' framing", () => {
    for (const preset of CALCULATOR_PRESETS) {
      expect(preset.label.startsWith("Example:")).toBe(true);
    }
  });

  it("no label contains an advice verb or superlative", () => {
    for (const preset of CALCULATOR_PRESETS) {
      expect(preset.label).not.toMatch(ADVICE_VERB_PATTERN);
    }
  });
});

describe("U-01 — preset buttons render above-fold, adjacent to inputs, with zero ad markers nearby (K05 extension)", () => {
  it("CostCalculator's pre-calculation markup contains every preset label", () => {
    const html = renderToStaticMarkup(createElement(CostCalculator, {}));
    for (const preset of CALCULATOR_PRESETS) {
      expect(html).toContain(preset.label);
    }
  });

  it("still contains zero ad markers anywhere in the pre-calculation markup (extends tests/ad-proximity.test.ts K05 guarantee to include the new preset buttons)", () => {
    const html = renderToStaticMarkup(createElement(CostCalculator, {}));
    for (const marker of ["adsbygoogle", "<ins"]) {
      expect(html).not.toContain(marker);
    }
  });

  it("the preset buttons render inside the same Card as the K05 ad-exclusion-zone marker (structurally grouped with the inputs, not a separate/ad-like block)", () => {
    const src = readSource("src/components/calculator/cost-calculator.tsx");
    const cardMatch = src.match(
      /<Card className="border-slate-200 shadow-sm" data-ad-exclusion-zone="calculator-widget">[\s\S]*?<\/Card>/,
    );
    expect(cardMatch).not.toBeNull();
    expect(cardMatch![0]).toContain("CALCULATOR_PRESETS.map");
  });
});

describe("U-01 — TermsGate is never bypassed by a preset click (source audit)", () => {
  const src = readSource("src/components/calculator/cost-calculator.tsx");
  const handlerMatch = src.match(/const handlePresetClick = useCallback\(\s*\(preset: CalculatorPreset\) => \{[\s\S]*?\n {4}\},/);

  it("handlePresetClick is defined", () => {
    expect(handlerMatch).not.toBeNull();
  });

  it("never calls termsGate.accept() or writes consent directly — the only gated path to a computed result is runCalculate(), invoked conditionally on termsGate.hasConsented", () => {
    const body = handlerMatch![0];
    expect(body).not.toMatch(/termsGate\.accept\(/);
    expect(body).not.toMatch(/writeStoredConsent/);
    expect(body).not.toMatch(/localStorage/);
    expect(body).toMatch(/if \(termsGate\.hasConsented\)/);
    expect(body).toMatch(/runCalculate\(/);
  });

  it("marks interacted (T03 guard) before injecting the preset's input values — same order as a real dropdown edit", () => {
    const body = handlerMatch![0];
    const markIdx = body.indexOf("markInteracted()");
    const setCategoryIdx = body.indexOf("setCategory(preset.category)");
    expect(markIdx).toBeGreaterThan(-1);
    expect(setCategoryIdx).toBeGreaterThan(-1);
    expect(markIdx).toBeLessThan(setCategoryIdx);
  });

  it("calculator_complete's event params never include a preset id — only calc_type (source audit on runCalculate's trackEvent call)", () => {
    const trackCallMatch = src.match(/trackEvent\("calculator_complete",\s*\{[^}]*\}\)/);
    expect(trackCallMatch).not.toBeNull();
    expect(trackCallMatch![0]).not.toMatch(/preset/i);
    expect(trackCallMatch![0]).toContain("calc_type");
  });
});
