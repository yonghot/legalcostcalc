import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { STATES } from "@/lib/constants/states";
import { getCostForPage } from "@/lib/services/cost-service";
import { CostResult } from "@/components/calculator/cost-result";
import costsSeed from "@/data/seed/costs.json";

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

const TEXT_CONTINGENCY_LINE = /Contingency fee \(\d+(?:-\d+)?% of settlement\)/i;

describe("K4: personal injury fee text never contradicts the numeric contingency band", () => {
  it("the seed carries free-text contingency lines that disagree with the numeric triples", () => {
    const rows = (costsSeed as Array<{ category: string; common_fees: string[] | null }>).filter(
      (r) => r.category === "personal-injury",
    );
    expect(rows.some((r) => (r.common_fees ?? []).some((f) => TEXT_CONTINGENCY_LINE.test(f)))).toBe(true);
  });

  it("the service drops the restated contingency line wherever the numeric triple exists", async () => {
    for (const state of STATES) {
      const rows = await getCostForPage("personal-injury", state.code);
      expect(rows).toHaveLength(3);
      for (const row of rows) {
        expect(row.contingencyFee, `${state.code} ${row.complexity}`).not.toBeNull();
        expect(row.commonFees.filter((f) => /^Contingency fee/i.test(f)), `${state.code} ${row.complexity}`).toEqual([]);
        expect(row.commonFees.length).toBeGreaterThan(0);
      }
    }
  });

  it("matters without a contingency band keep every non-court fee line", async () => {
    const seedRow = (costsSeed as Array<{ category: string; state_code: string; complexity: string; common_fees: string[] }>)
      .find((r) => r.category === "divorce" && r.state_code === "AL" && r.complexity === "moderate")!;
    const row = (await getCostForPage("divorce", "AL")).find((r) => r.complexity === "moderate")!;
    expect(row.contingencyFee).toBeNull();
    expect(row.commonFees).toHaveLength(seedRow.common_fees.length);
    expect(row.commonFees.filter((f) => !/^Court filing fee/.test(f))).toEqual(
      seedRow.common_fees.filter((f) => !/^Court filing fee/.test(f)),
    );
  });

  it.each(STATES.map((s) => [s.name, s.slug] as const))("%s personal injury page states one contingency band, labeled nationwide", async (_n, slug) => {
    const html = text(await renderPage(StateCategoryPage, { state: slug, slug: "personal-injury-cost" } as never));
    expect(html).not.toMatch(TEXT_CONTINGENCY_LINE);
    expect(html).toMatch(/nationwide/i);
    const moderate = (await getCostForPage("personal-injury", STATES.find((s) => s.slug === slug)!.code)).find(
      (r) => r.complexity === "moderate",
    )!;
    const { low, high } = moderate.contingencyFee!;
    expect(html).toContain(`${low}% – ${high}%`);
    expect(html).toContain(`${low}-${high}%`);
  });

  it("the calculator result card labels the contingency band as a nationwide range, not a state fact", async () => {
    const rows = await getCostForPage("personal-injury", "NY");
    const moderate = rows.find((r) => r.complexity === "moderate")!;
    const html = text(
      renderToStaticMarkup(
        createElement(CostResult, {
          results: [moderate],
          stateName: "New York",
          categoryName: "Personal Injury",
          categorySlug: "personal-injury",
          stateCode: "NY",
          stateSlug: "new-york",
          monetizationDisabled: true,
        }),
      ),
    );
    const { low, high } = moderate.contingencyFee!;
    expect(html).toContain(`${low}% – ${high}%`);
    expect(html).toMatch(/Typical nationwide range, not specific to New York/);
    expect(html).not.toMatch(TEXT_CONTINGENCY_LINE);
  });

  it("no page ranks or compares states by contingency rate", async () => {
    const triples = new Set<string>();
    for (const state of STATES) {
      const moderate = (await getCostForPage("personal-injury", state.code)).find((r) => r.complexity === "moderate")!;
      const c = moderate.contingencyFee!;
      triples.add(`${c.low}/${c.median}/${c.high}`);
    }
    expect(triples.size).toBeLessThanOrEqual(3);
    const html = text(await renderPage(StateCategoryPage, { state: "texas", slug: "personal-injury-cost" } as never));
    expect(html).not.toMatch(/contingency[^.]{0,80}\b(rank|ranks|ranked|highest|lowest|above the|below the)\b/i);
  });
});
