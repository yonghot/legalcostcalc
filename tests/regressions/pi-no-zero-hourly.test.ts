import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORY_MAP } from "@/lib/constants/categories";
import { getCostForPage } from "@/lib/services/cost-service";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { AnswerBlock } from "@/components/seo/answer-block";
import { CostDetailsSection } from "@/components/seo/cost-details-section";

const ZERO_HOURLY: Array<[string, RegExp]> = [
  ["a $0-$0 band", /\$0\s*[–-]\s*\$0/],
  ["$0 an hour", /\$0 an hour/],
  ["$0/hr", /\$0\/hr/],
  ["at $0", /\bat \$0\b/],
  ["professional time", /professional time/i],
];

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

async function piCosts(stateCode: string) {
  return getCostForPage("personal-injury", stateCode);
}

describe("K4: personal injury pages never print a zero hourly rate", () => {
  it.each(STATES.map((s) => [s.name, s.slug] as const))("%s personal injury page", async (_name, slug) => {
    const page = text(await renderPage(StateCategoryPage, { state: slug, slug: "personal-injury-cost" } as never));
    for (const [label, pattern] of ZERO_HOURLY) {
      expect(page, `${slug}: ${label}`).not.toMatch(pattern);
    }
    expect(page).toMatch(/contingency/i);
    expect(page).toMatch(/case expenses/i);
    expect(page).toMatch(/nationwide/i);
  });
});

describe("K4: hourly matters keep their hourly sentences", () => {
  it("California divorce still shows the hourly band, implied hours and the professional-time remainder", async () => {
    const page = text(await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never));
    expect(page).toMatch(/Attorney rate: \$\d[\d,]*–\$\d[\d,]* an hour across the three tiers/);
    expect(page).toMatch(/Attorney Hourly Rate in California/);
    expect(page).toMatch(/at \$\d[\d,]*–\$\d[\d,]*\/hr over/);
    expect(page).toMatch(/Billed hours: about/);
    expect(page).toMatch(/as professional time/);
  });
});

describe("K4: personal injury answer block leads with the contingency fee and labels the dollars", () => {
  const entity = async () => {
    const costs = await piCosts("NY");
    const moderate = costs.find((c) => c.complexity === "moderate")!;
    const block = buildAnswerBlock({
      category: CATEGORY_MAP.get("personal-injury")!,
      state: STATE_BY_SLUG.get("new-york")!,
      costs,
      dataVerifiedDate: moderate.lastVerifiedAt,
    });
    return { costs, moderate, block };
  };

  it("states the contingency range and that the dollar figures are case expenses, in 40 to 60 words", async () => {
    const { moderate, block } = await entity();
    expect(moderate.contingencyFee).not.toBeNull();
    const { low, high } = moderate.contingencyFee!;
    expect(block.answer).toContain(`${low}-${high}%`);
    expect(block.answer).toMatch(/contingency/);
    expect(block.answer).toMatch(/case expenses/);
    expect(block.answer).toMatch(/nationwide/);
    expect(block.answer).toContain("$5,700");
    expect(block.answer).not.toMatch(/\$0\b/);
    expect(block.answer).not.toMatch(/attorney rates|per hour|hourly/i);
    expect(block.answerWordCount).toBeGreaterThanOrEqual(40);
    expect(block.answerWordCount).toBeLessThanOrEqual(60);
    expect(wordCount(block.answer)).toBe(block.answerWordCount);
  });

  it("does not call the case expenses a cost driven by attorney hours or list an hourly rate factor", async () => {
    const { block } = await entity();
    const all = [...block.stats.map((s) => s.text), ...block.factors].join(" | ");
    expect(all).not.toMatch(/attorney hours/i);
    expect(all).not.toMatch(/hourly rate/i);
    expect(all).toMatch(/case expense/i);
    expect(block.stats.length).toBeGreaterThanOrEqual(2);
  });

  it("carries a basis note that renders under the table", async () => {
    const { block } = await entity();
    expect(block.costBasisNote).toMatch(/case expenses/);
    const html = renderToStaticMarkup(createElement(AnswerBlock, { block }));
    expect(html).toContain("Dollar figures in this table are estimated case expenses (filing fees, records, experts), not attorney fees;");
  });

  it("an hourly matter keeps its answer, factors and has no basis note", async () => {
    const costs = await getCostForPage("divorce", "CA");
    const block = buildAnswerBlock({
      category: CATEGORY_MAP.get("divorce")!,
      state: STATE_BY_SLUG.get("california")!,
      costs,
      dataVerifiedDate: costs[0].lastVerifiedAt,
    });
    expect(block.answer).toMatch(/Typical attorney rates run \$\d/);
    expect(block.factors).toContain("Attorney hourly rate, which varies by state and experience level");
    expect(block.costBasisNote).toBeNull();
  });
});

describe("K4: cost details section for a contingency matter", () => {
  it("shows the contingency fee card and no hourly lever or card", async () => {
    const costs = await piCosts("AL");
    const moderate = costs.find((c) => c.complexity === "moderate")!;
    const html = text(
      renderToStaticMarkup(
        createElement(CostDetailsSection, {
          categoryName: "Personal Injury",
          stateName: "Alabama",
          commonFees: moderate.commonFees,
          hourlyRate: moderate.hourlyRate,
          typicalDuration: moderate.typicalDuration,
          costs,
        }),
      ),
    );
    const { low, high } = moderate.contingencyFee!;
    expect(html).toContain("Attorney Contingency Fee");
    expect(html).toContain(`${low}%`);
    expect(html).toContain(`${high}%`);
    expect(html).toContain("Typical Case Duration");
    expect(html).toMatch(/case expenses/);
    expect(html).not.toMatch(/Attorney Hourly Rate/);
    expect(html).not.toMatch(/an hour across the three tiers/);
    expect(html).not.toMatch(/Billed hours/);
    expect(html).not.toMatch(/\$0\b/);
  });
});
