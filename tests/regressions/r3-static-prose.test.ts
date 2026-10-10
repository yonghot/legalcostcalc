import "./helpers/render";
import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import DivorceCostByStatePage from "@/app/divorce-cost-by-state/page";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { getCategoryTierFigures } from "@/lib/page-index";

/*
 * Convergence order 2026-10-11 02:40: static category templates and the divorce hub state what they define or what the
 * data shows. A comparative, superlative, causal, frequency or quantity claim that no row can decide does not appear.
 */

const UNDECIDABLE =
  /\b(?:typically|generally|usually|often|most (?:personal|cases|complex)|significantly|substantially|largest|biggest|least expensive|primarily|mainly|almost entirely|which is why|well above|worth it|more availability|smaller caseloads|a few thousand|vary so much)\b|\b2-5%|33-40%/i;

const templateText = (c: (typeof CATEGORIES)[number]) =>
  [...(c.faqTemplates ?? []).map((t) => t.answerTemplate), ...(c.costFormationNotes ?? [])].join(" ");

describe("convergence: category templates define things and make no claim the rows cannot decide", () => {
  it("no FAQ answer or cost-formation note carries a comparative, frequency or quantity verdict", () => {
    const bad = CATEGORIES.flatMap((c) => {
      const hit = templateText(c).match(UNDECIDABLE);
      return hit ? [`${c.slug}: ${hit[0]}`] : [];
    });
    expect(CATEGORIES.length).toBe(8);
    expect(bad).toEqual([]);
  });

  it("positive control: the checker flags the earlier wording of each removed claim", () => {
    const earlier = [
      "is significantly cheaper",
      "substantially increasing legal costs",
      "Most personal injury lawyers in Texas work on contingency",
      "The attorney receives a percentage (typically 33-40%)",
      "generally range from 2-5% of the purchase price",
      "which is why complex-case costs run well above the simple-case median",
      "can be worth it for serious charges",
      "The biggest cost driver in probate",
      "often exceed the attorney fee alone",
      "Simple estates may cost a few thousand dollars",
    ];
    for (const sentence of earlier) expect(sentence, sentence).toMatch(UNDECIDABLE);
  });

  it("'the estimates on this page rise from the simple tier to the complex tier' holds for every state of the two matters that say so", () => {
    for (const slug of ["divorce", "criminal-defense"]) {
      const text = templateText(CATEGORIES.find((c) => c.slug === slug)!);
      expect(text, slug).toMatch(/the estimates on this page rise from the simple tier to the complex tier/i);
      const simple = new Map(getCategoryTierFigures(slug, "simple").map((r) => [r.stateCode, r.median]));
      const complex = new Map(getCategoryTierFigures(slug, "complex").map((r) => [r.stateCode, r.median]));
      const wrong = STATES.filter((s) => {
        const a = simple.get(s.code);
        const b = complex.get(s.code);
        return a !== undefined && b !== undefined && !(b > a);
      }).map((s) => s.code);
      expect(simple.size, slug).toBeGreaterThan(40);
      expect(wrong, slug).toEqual([]);
    }
  });
});

describe("convergence: the divorce hub names its sources and the tiers it tabulates and draws no conclusion from them", () => {
  const full = renderToStaticMarkup(createElement(DivorceCostByStatePage)).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const text = full.slice(0, full.indexOf("This tool provides general cost estimates"));

  it("no typical, substantial or causal wording remains in the visible text or the intro", () => {
    expect(text).not.toMatch(UNDECIDABLE);
    expect(text).not.toMatch(/typical (?:total cost|attorney fee)|typically resolved|often expert witnesses|requiring discovery/i);
    expect(text).not.toMatch(/\(typical\)/);
    expect(text).toMatch(/Uncontested \(median\) Contested \(median\)/);
    expect(text).toMatch(/median estimated total cost/);
    expect(full.length).toBeGreaterThan(text.length);
    expect(text).toMatch(/Where do the state divorce figures come from\?/);
  });
});
