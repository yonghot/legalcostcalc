import { describe, expect, it } from "vitest";
import "./helpers/render";
import { CATEGORIES } from "@/lib/constants/categories";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";

/*
 * CLAUDE.md: never implement advice-type features ("Should I...", "Do I need..."). The category FAQ templates render on
 * every state x matter page, so their questions are cost or general-information questions and their answers give no
 * view on what the reader should do.
 */
const ADVICE_QUESTION: Array<[string, RegExp]> = [
  ["Can I", /\bcan i\b/i],
  ["Should I", /\bshould i\b/i],
  ["Do I need / have to", /\bdo i (?:need|have to)\b/i],
  ["Must I / Am I", /\b(?:must|am) i\b/i],
  ["is a(n) ... required", /\bis (?:an? )?[\w ]+ (?:required|necessary|needed)\b/i],
];

const ADVICE_ANSWER: Array<[string, RegExp]> = [
  ["benefit from professional representation", /benefit from|professional representation/i],
  ["can help you navigate", /\bcan help (?:you )?(?:to )?navigate\b/i],
  ["protect your interests", /protect your interests/i],
  ["consult an attorney", /\bconsult\b/i],
  ["you should / need / must", /\byou (?:should|need|must)\b/i],
];

const templates = CATEGORIES.flatMap((c) => (c.faqTemplates ?? []).map((t) => ({ slug: c.slug, ...t })));

describe("advice-type FAQ templates are cost or general-information questions", () => {
  it("covers the category FAQ templates of all 8 matter types", () => {
    expect(new Set(templates.map((t) => t.slug)).size).toBe(8);
    expect(templates.length).toBeGreaterThanOrEqual(16);
  });

  it.each(ADVICE_QUESTION)("no template question asks '%s'", (_name, pattern) => {
    expect(templates.filter((t) => pattern.test(t.questionTemplate)).map((t) => `${t.slug}: ${t.questionTemplate}`)).toEqual([]);
  });

  it.each(ADVICE_ANSWER)("no template answer says '%s'", (_name, pattern) => {
    expect(templates.filter((t) => pattern.test(t.answerTemplate)).map((t) => `${t.slug}: ${t.answerTemplate.slice(0, 90)}`)).toEqual([]);
  });

  it("the matchers catch the earlier divorce, closing and green card wording", () => {
    const earlier = [
      ["Can I file for divorce without a lawyer in {state}?", ADVICE_QUESTION],
      ["Is a real estate attorney required for closing in {state}?", ADVICE_QUESTION],
      ["Do I need an immigration lawyer for a green card application from {state}?", ADVICE_QUESTION],
      ["Do I have to take a credit counseling course before filing bankruptcy in {state}?", ADVICE_QUESTION],
      ["Simple family-based petitions may not require an attorney, but employment-based, removal defense, and complex cases benefit from professional representation.", ADVICE_ANSWER],
      ["Even when not legally required, a real estate attorney can review contracts, resolve title issues, and protect your interests.", ADVICE_ANSWER],
      ["Consult the {state} state court website or an attorney for current deadlines.", ADVICE_ANSWER],
    ] as const;
    for (const [text, set] of earlier) expect(set.some(([, pattern]) => pattern.test(text)), text).toBe(true);
  });

  it("the rendered divorce, real estate and immigration pages carry the rewritten questions", async () => {
    for (const [slug, lead] of [
      ["divorce-cost", "What does a self-represented (pro se) divorce cost in California"],
      ["real-estate-cost", "How do attorney fees fit into real estate closing costs in California"],
      ["immigration-cost", "What drives the attorney cost of a green card application from California"],
    ] as const) {
      const html = await renderPage(StateCategoryPage, { state: "california", slug } as never);
      expect(html, slug).toContain(lead);
    }
  });
});
