import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import CategoryHubPage, { generateMetadata } from "@/app/category/[category]/page";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";

describe("UX P1-4: a category hub states how many states its table lists", () => {
  for (const category of CATEGORIES) {
    it(`${category.slug}: the intro and the meta description match the table rows`, async () => {
      const html = await renderPage(CategoryHubPage, { category: category.slug });
      const body = html.match(/<tbody[\s\S]*?<\/tbody>/)?.[0] ?? "";
      const rows = (body.match(/<tr\b/g) ?? []).length;
      expect(rows).toBeGreaterThan(0);
      const intro = html.match(/Compare estimated[^<]*/)?.[0] ?? "";
      const meta = await generateMetadata({ params: Promise.resolve({ category: category.slug }) });
      const description = String(meta.description);
      if (rows === STATES.length) {
        expect(intro).toContain("all 50 states and the District of Columbia");
        expect(description).toContain("all 50 states and DC");
      } else {
        expect(intro).toContain(`across ${rows} states`);
        expect(description).toContain(`across ${rows} states`);
        expect(intro).not.toContain("all 50 states");
        expect(description).not.toContain("all 50 states");
      }
    });
  }
});
