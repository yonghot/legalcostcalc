import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { getCategoryTierFigures } from "@/lib/page-index";
import { tempoSentence } from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import { PAGES, collect, monthsOf, tierRow, usd, type Page, type Tier } from "./helpers/k4a-oracle";

/*
 * K4-a EXTENSION (continued) / K30(5): durations are one national value per matter and complexity, so a sentence may
 * say the estimate assumes them. It may not present them as something the sources recorded for the state.
 */

function checkTempo(p: Page, text: string | null): string[] {
  const m = tierRow(p, "moderate")!;
  const c = tierRow(p, "complex");
  const mm = monthsOf(m.duration);
  if (!mm || mm <= 0 || !m.duration) return text === null ? [] : ["a sentence exists without a parsable moderate duration"];
  if (text === null) return ["no tempo sentence although the moderate duration parses"];
  const v: string[] = [];
  const perMonth = Math.round(m.median / mm);
  const cm = c ? monthsOf(c.duration) : null;
  if (/sources record|recorded/.test(text)) v.push("attributes a national duration to the sources");
  if (!/national/.test(text)) v.push("does not say the duration is a national figure");
  if (!text.includes(m.duration)) v.push(`moderate duration ${m.duration} missing`);
  if (!text.includes(usd(m.median)) || !text.includes(usd(perMonth))) v.push(`${usd(m.median)} or ${usd(perMonth)} a month missing`);
  if (c && cm && cm > 0) {
    const cPer = Math.round(c.median / cm);
    if (/hotter|longer|less per month|because|are close|simply|heavier/.test(text)) v.push("keeps a comparative or causal claim about the complex tier");
    if (!text.includes(usd(c.median)) || !text.includes(usd(cPer)) || !c.duration || !text.includes(c.duration)) v.push("complex median, per-month figure or duration missing");
  } else if (c && /\bcomplex\b/.test(text)) {
    v.push("describes the complex tier although its duration does not parse");
  }
  return v;
}

function checkDurationFaq(p: Page, faq: { question: string; answer: string }[]): string[] {
  const m = tierRow(p, "moderate")!;
  const s = tierRow(p, "simple");
  const entry = faq.find((f) => /^How long does/.test(f.question));
  if (!m.duration) return entry ? ["a duration answer without a duration"] : [];
  if (!entry) return ["no duration answer"];
  const v: string[] = [];
  const a = entry.answer;
  if (/sources record|recorded/.test(a)) v.push("attributes a national duration to the sources");
  if (!a.startsWith(`The estimate assumes ${m.duration} for a moderate-complexity matter`)) v.push("does not open with the duration the estimate assumes");
  if (!/national figures? for this matter and complexity, not specific to/.test(a)) v.push("does not say the durations are national, not state-specific");
  if (s?.duration && !a.includes(`and ${s.duration} for a simple one`)) v.push("simple duration missing");
  const mm = monthsOf(m.duration);
  if (mm && !a.includes(`roughly ${usd(m.median / mm)} a month`)) v.push("per-month figure wrong");
  return v;
}

describe("K4-a extension: durations are described as the national assumption they are", () => {
  it("tempoSentence assumes rather than records, and states the per-month figures without a comparison (every page)", () => {
    expect(collect((p) => checkTempo(p, tempoSentence(p.ctx, p.label)))).toEqual([]);
  });

  it("the duration FAQ answer opens with what the estimate assumes and says the figure is national (every page)", () => {
    expect(collect((p) => checkDurationFaq(p, buildStateFaq(p.ctx, p.label)))).toEqual([]);
  });

  it("the durations really are one national value per matter and tier, which is what the sentences say", () => {
    const differing: string[] = [];
    for (const c of CATEGORIES) {
      for (const tier of ["simple", "moderate", "complex"] as Tier[]) {
        const values = new Set(getCategoryTierFigures(c.slug, tier).map((r) => r.duration));
        if (values.size !== 1) differing.push(`${c.slug}/${tier}: ${[...values].join(" | ")}`);
      }
    }
    expect(differing).toEqual([]);
  });

  it("every tempo branch occurs, so none of the checks is vacuous", () => {
    const seen = new Map<string, number>();
    for (const p of PAGES) {
      const text = tempoSentence(p.ctx, p.label);
      const hit = (name: string, re: RegExp) => text && re.test(text) && seen.set(name, (seen.get(name) ?? 0) + 1);
      hit("both tiers", /complex median is/);
      hit("moderate only", /^Across the/);
      if (text === null) seen.set("none", (seen.get("none") ?? 0) + 1);
    }
    expect(["both tiers", "moderate only", "none"].filter((n) => !seen.get(n))).toEqual([]);
  });

  it("positive control: the checkers flag the earlier 'the sources record' wording", () => {
    const tempoPage = PAGES.find((p) => /national/.test(tempoSentence(p.ctx, p.label) ?? ""))!;
    expect(tempoPage).toBeDefined();
    const tempoText = tempoSentence(tempoPage.ctx, tempoPage.label)!;
    expect(checkTempo(tempoPage, tempoText)).toEqual([]);
    expect(checkTempo(tempoPage, `${tempoText} The sources record these durations.`).join(" ")).toMatch(/attributes a national duration to the sources/);
    const faqPage = PAGES.find((p) => !!tierRow(p, "moderate")!.duration)!;
    const faq = buildStateFaq(faqPage.ctx, faqPage.label);
    expect(checkDurationFaq(faqPage, faq)).toEqual([]);
    const old = faq.map((f) => ({ ...f, answer: f.answer.replace(/^The estimate assumes/, "The sources record") }));
    expect(checkDurationFaq(faqPage, old).join(" ")).toMatch(/attributes a national duration to the sources/);
  });
});
