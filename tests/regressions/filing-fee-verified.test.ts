import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { getCostForPage } from "@/lib/services/cost-service";
import costsSeed from "@/data/seed/costs.json";
import verifiedFees from "@/data/verified-fees.json";

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, " ");

const page = async (state: string, category: string) =>
  text(await renderPage(StateCategoryPage, { state, slug: `${category}-cost` } as never));

const SEED_COURT_FEE = /Court filing fee \(\$[\d,]+/;
const FEE_SHARE_SENTENCE = /\d+%\s*[–-]\s*\d+% of the [A-Za-z ]+ median/;

describe("K4: verified-fees data file", () => {
  it("every entry has a state, category, item, dollar range, https source and ISO fetch date", () => {
    expect(verifiedFees.length).toBeGreaterThanOrEqual(1);
    for (const entry of verifiedFees) {
      expect(entry.state).toMatch(/^[A-Z]{2}$/);
      expect(CATEGORIES.map((c) => c.slug)).toContain(entry.category);
      expect(entry.item).toBe("Court filing fee");
      expect(entry.range).toMatch(/^\$[\d,]+-\$[\d,]+$/);
      expect(entry.sourceUrl).toMatch(/^https:\/\//);
      expect(entry.fetchedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("carries California divorce at $435-$450 from the California Courts self-help guide", () => {
    const ca = verifiedFees.find((e) => e.state === "CA" && e.category === "divorce");
    expect(ca?.range).toBe("$435-$450");
    expect(new URL(ca!.sourceUrl).hostname).toBe("selfhelp.courts.ca.gov");
  });
});

describe("K4: service output keeps no unsourced per-state court filing fee", () => {
  it("replaces the seed's identical national range with an unnumbered line outside verified states", async () => {
    const seedStrings = new Set(
      (costsSeed as Array<{ common_fees: string[] | null }>)
        .flatMap((r) => r.common_fees ?? [])
        .filter((f) => SEED_COURT_FEE.test(f)),
    );
    expect(seedStrings.size).toBeGreaterThan(0);
    for (const state of ["TX", "FL", "WY"]) {
      const rows = await getCostForPage("divorce", state);
      const fees = rows.flatMap((r) => r.commonFees);
      expect(fees.filter((f) => SEED_COURT_FEE.test(f)), state).toEqual([]);
      expect(fees).toContain("Court filing fee (set by the court; varies by county)");
    }
  });

  it("shows the verified range for California divorce on all three tiers", async () => {
    const rows = await getCostForPage("divorce", "CA");
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(row.commonFees).toContain("Court filing fee ($435-$450)");
      expect(row.commonFees.join(" ")).not.toContain("$100-$400");
    }
  });
});

describe("K4: rendered divorce pages", () => {
  it.each(STATES.map((s) => [s.name, s.slug] as const))("%s divorce page prints no seed filing-fee range", async (_n, slug) => {
    const html = await page(slug, "divorce");
    expect(html).not.toMatch(/\$100\s*[–-]\s*\$400/);
    if (slug !== "california") expect(html).not.toMatch(/[Cc]ourt filing fee \(\$[\d,]+/);
  });

  it.each(["florida", "texas"])("%s divorce page has no percentage-of-median fee sentence, itemised total or implied professional time", async (slug) => {
    const html = await page(slug, "divorce");
    expect(html).not.toMatch(FEE_SHARE_SENTENCE);
    expect(html).not.toMatch(/itemised lines come to/);
    expect(html).not.toMatch(/as professional time/);
    expect(html).toContain("Court filing fee (set by the court; varies by county)");
  });

  it("California divorce shows $435-$450 with its source domain and the check date", async () => {
    const html = await page("california", "divorce");
    expect(html).toContain("Court filing fee ($435-$450)");
    expect(html).toContain("selfhelp.courts.ca.gov");
    expect(html).toMatch(/[Cc]hecked October 7, 2026/);
    expect(html).toMatch(/Court filing fee runs \$435–\$450, or \d+%–\d+% of the California median/);
    expect(html).not.toMatch(/itemised lines come to/);
  });

  it("the source link opens the recorded primary page", async () => {
    const raw = await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never);
    const ca = verifiedFees.find((e) => e.state === "CA" && e.category === "divorce")!;
    expect(raw).toContain(`href="${ca.sourceUrl}"`);
  });
});

describe("K4: the rule applies to every category that carries a seed court filing fee", () => {
  const categories = [
    ...new Set(
      (costsSeed as Array<{ category: string; common_fees: string[] | null }>)
        .filter((r) => (r.common_fees ?? []).some((f) => SEED_COURT_FEE.test(f)))
        .map((r) => r.category),
    ),
  ];

  it("finds more than one affected category", () => {
    expect(categories.length).toBeGreaterThan(1);
  });

  it.each(categories)("%s page in Alabama carries no seed court filing fee range or fee share sentence", async (category) => {
    const html = await page("alabama", category);
    expect(html).not.toMatch(SEED_COURT_FEE);
    expect(html).not.toMatch(FEE_SHARE_SENTENCE);
    expect(html).not.toMatch(/itemised lines come to/);
  });
});
