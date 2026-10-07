import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import "./helpers/render";
import { CostResult } from "@/components/calculator/cost-result";
import { hostLabel } from "@/lib/utils/format";
import type { LegalCostData } from "@/lib/types";

const COST: LegalCostData = {
  id: "ux-source-labels",
  category: "bankruptcy",
  stateCode: "AL",
  complexity: "moderate",
  costRange: { low: 1500, median: 3200, high: 6000 },
  hourlyRate: { low: 200, median: 300, high: 400 },
  typicalDuration: "4-6 months",
  commonFees: ["Court filing fee"],
  sources: ["https://www.uscourts.gov/services-forms/fees", "https://www.nolo.com/legal-encyclopedia/bankruptcy-cost"],
  lastVerifiedAt: "2026-04-01",
};

describe("UX P1-3: result sources are named by their site, not by position", () => {
  it("the source chips read as host names and keep their links", () => {
    const html = renderToStaticMarkup(
      createElement(CostResult, { results: [COST], stateName: "Alabama", categoryName: "Bankruptcy", monetizationDisabled: true }),
    );
    const chips = [...html.matchAll(/<a\b[^>]*href="(https:\/\/[^"]+)"[^>]*>([^<]*)</g)].map((m) => [m[1], m[2]]);
    expect(chips).toEqual([
      ["https://www.uscourts.gov/services-forms/fees", "uscourts.gov"],
      ["https://www.nolo.com/legal-encyclopedia/bankruptcy-cost", "nolo.com"],
    ]);
    expect(html).not.toMatch(/Source \d/);
  });

  it("hostLabel drops only a leading www and survives bad input", () => {
    expect(hostLabel("https://www.bls.gov/ooh/legal/lawyers.htm")).toBe("bls.gov");
    expect(hostLabel("https://wwwx.example.com/a")).toBe("wwwx.example.com");
    expect(hostLabel("not a url")).toBe("not a url");
  });
});
