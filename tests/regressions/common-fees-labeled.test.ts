import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import costsSeed from "@/data/seed/costs.json";

type SeedRow = { category: string; state_code: string; complexity: string; common_fees: string[] | null };
const SEED = costsSeed as SeedRow[];

const decode = (s: string) => s.replace(/&#x27;|&#39;|&apos;/g, "'").replace(/&amp;/g, "&");
const plain = (html: string) => decode(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

function feeSection(html: string, stateName: string) {
  const heading = html.match(new RegExp(`<h2[^>]*>Common [^<]* Fees in ${stateName}</h2>([\\s\\S]*?)<ul`));
  const list = html.match(new RegExp(`<h2[^>]*>Common [^<]* Fees in ${stateName}</h2>[\\s\\S]*?(<ul[\\s\\S]*?</ul>)`));
  return { between: heading ? plain(heading[1]!) : null, list: list ? plain(list[1]!) : null };
}

const NOTE = /not specific to/;

describe("K4: fee lines that are the same in every state are labeled as nationwide figures", () => {
  it("the seed repeats each category's fee lines verbatim in all 51 states, which is why they cannot read as state-specific", () => {
    for (const category of CATEGORIES) {
      const moderate = SEED.filter((r) => r.category === category.slug && r.complexity === "moderate");
      expect(moderate.length, category.slug).toBe(STATES.length);
      const first = JSON.stringify(moderate[0]!.common_fees);
      for (const row of moderate) expect(JSON.stringify(row.common_fees), `${category.slug}/${row.state_code}`).toBe(first);
    }
  });

  for (const category of CATEGORIES) {
    it(`${category.slug}: the fee list carries a note that the figures are typical nationwide ranges`, async () => {
      const pages = INDEXABLE_PAGES.filter((p) => p.category.slug === category.slug);
      const sample = [pages[0]!, pages[Math.floor(pages.length / 2)]!, pages[pages.length - 1]!];
      for (const page of sample) {
        const html = await renderPage(StateCategoryPage, { state: page.state.slug, slug: `${category.slug}-cost` });
        const { between, list } = feeSection(html, page.state.name);
        expect(between, page.path).not.toBeNull();
        expect(list, page.path).toMatch(/[$%]/);
        expect(between, page.path).toMatch(NOTE);
        expect(between, page.path).toContain(`not specific to ${page.state.name}`);
        expect(between, page.path).toMatch(/set federally|set by federal/);
        expect(between, page.path).toMatch(/vary by court, county or provider/);
      }
    });
  }

  it("California divorce: the checked court filing fee is state-specific and the note says only that line is", async () => {
    const html = await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" });
    const { between, list } = feeSection(html, "California");
    expect(list).toContain("Court filing fee ($435-$450)");
    expect(between).toMatch(/Lines marked Checked are confirmed for California/);
    expect(between).toContain("The other figures are typical nationwide ranges, not specific to California");
  });

  it("positive control: the matcher finds nothing when the note is removed", async () => {
    const html = await renderPage(StateCategoryPage, { state: "texas", slug: "dui-cost" });
    const { between } = feeSection(html, "Texas");
    expect(between).toMatch(NOTE);
    const without = html.replace(/<p[^>]*>[^<]*not specific to Texas[^<]*<\/p>/, "");
    expect(feeSection(without, "Texas").between ?? "").not.toMatch(NOTE);
  });
});
