import { afterEach, describe, expect, it, vi } from "vitest";
import "./helpers/render";
import { titleText } from "./helpers/title";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import sitemap from "@/app/sitemap";
import contentDates from "@/data/content-dates.json";
import { GUIDE_UPDATED } from "@/app/how-legal-fees-work/content";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import { INDEXED_PAGES } from "@/lib/index-policy";
import { buildMeta, CANONICAL_ORIGIN, fitTitle } from "@/lib/seo";
import { generateMetadata } from "@/app/[state]/[slug]/page";
import { getFamilyDate, maxFamilyDate, costFamilyKey } from "@/lib/content-dates";

const read = (rel: string) => readFileSync(join(process.cwd(), rel), "utf8");

const dateOf = (entry: { lastModified?: string | Date }) =>
  entry.lastModified instanceof Date ? entry.lastModified.toISOString().slice(0, 10) : entry.lastModified;

const costKeys = CATEGORIES.map((c) => costFamilyKey(c.slug));

afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.doUnmock("@/data/content-dates.json");
});

describe("K3: content-dates records", () => {
  it("every family has an ISO date, a known basis and evidence", () => {
    const entries = Object.entries(contentDates as Record<string, { date: string; basis: string; evidence: string }>);
    expect(entries.length).toBeGreaterThan(8);
    for (const [key, record] of entries) {
      expect(record.date, key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(["sources-rechecked", "content-changed"], key).toContain(record.basis);
      expect(record.evidence.length, key).toBeGreaterThan(20);
    }
  });

  it("has a record for each of the 8 cost families and the guide", () => {
    for (const key of costKeys) expect(getFamilyDate(key), key).toBeDefined();
    expect(getFamilyDate("guide")?.date).toBe(GUIDE_UPDATED);
  });
});

describe("K3: sitemap lastmod comes from per-family dates", () => {
  const entries = sitemap();

  it("emits no changefreq on any of the entries and keeps priority", () => {
    expect(entries.length).toBeGreaterThan(100);
    for (const entry of entries) {
      expect(entry, entry.url).not.toHaveProperty("changeFrequency");
      expect(typeof entry.priority, entry.url).toBe("number");
    }
  });

  it("no entry carries the retired 2026-06-29 global constant", () => {
    expect(entries.filter((e) => dateOf(e)?.startsWith("2026-06-29")).map((e) => e.url)).toEqual([]);
  });

  it("each state/matter page uses its own category's family date", () => {
    expect(INDEXED_PAGES.length).toBeGreaterThan(30);
    for (const page of INDEXED_PAGES) {
      const entry = entries.find((e) => e.url === `${CANONICAL_ORIGIN}${page.path}`)!;
      expect(dateOf(entry), page.path).toBe(getFamilyDate(costFamilyKey(page.category.slug))!.date);
    }
  });

  it("category hubs equal their family and state hubs equal the maximum of their children", () => {
    for (const cat of CATEGORIES) {
      const entry = entries.find((e) => e.url === `${CANONICAL_ORIGIN}/category/${cat.slug}`)!;
      expect(dateOf(entry), cat.slug).toBe(getFamilyDate(costFamilyKey(cat.slug))!.date);
    }
    for (const state of STATES) {
      const entry = entries.find((e) => e.url === `${CANONICAL_ORIGIN}/${state.slug}`)!;
      expect(dateOf(entry), state.slug).toBe(maxFamilyDate(costKeys));
    }
  });

  it("static pages use their own record and the guide keeps GUIDE_UPDATED", () => {
    const byPath = (path: string) => entries.find((e) => e.url === `${CANONICAL_ORIGIN}${path}`)!;
    expect(dateOf(byPath("/how-legal-fees-work"))).toBe(GUIDE_UPDATED);
    expect(dateOf(byPath("/about"))).toBe(getFamilyDate("page:about")!.date);
    expect(dateOf(byPath("/compare"))).toBe(getFamilyDate("page:compare")!.date);
    expect(dateOf(entries.find((e) => e.url === CANONICAL_ORIGIN)!)).toBe(getFamilyDate("page:home")!.date);
  });

  it("dates differ across page types, so no single constant drives them", () => {
    const distinct = new Set(entries.map((e) => dateOf(e)));
    expect(distinct.size).toBeGreaterThan(2);
  });

  it("changing one family's date changes only that family's entries", async () => {
    const baseline = new Map(entries.map((e) => [e.url, dateOf(e)]));
    vi.resetModules();
    vi.doMock("@/data/content-dates.json", () => ({
      default: {
        ...contentDates,
        "cost:dui": { ...(contentDates as Record<string, object>)["cost:dui"], date: "2030-01-01" },
      },
    }));
    const { default: sitemapAfter } = await import("@/app/sitemap");
    const changed = sitemapAfter()
      .filter((e) => dateOf(e) !== baseline.get(e.url))
      .map((e) => e.url.replace(CANONICAL_ORIGIN, ""));
    expect(changed.length).toBeGreaterThan(0);
    const unexpected = changed.filter(
      (path) => !path.endsWith("/dui-cost") && path !== "/category/dui" && !STATES.some((s) => path === `/${s.slug}`),
    );
    expect(unexpected).toEqual([]);
    expect(changed.filter((p) => p.endsWith("/dui-cost")).length).toBeGreaterThan(0);
    expect(changed).toContain("/category/dui");
  });
});

describe("K3: title and description year come from the record, not the clock", () => {
  const sample = async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ state: "california", slug: "divorce-cost" }) });
    const generic = buildMeta({ title: "Divorce Cost by State", description: "d", path: "/divorce-cost-by-state" });
    return {
      state: titleText(meta.title),
      description: String(meta.description),
      generic: titleText(generic.title),
    };
  };

  it("titles and descriptions are identical at 2026-10-07 and 2027-01-01", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-07T12:00:00Z"));
    const before = await sample();
    vi.setSystemTime(new Date("2027-01-01T00:30:00Z"));
    const after = await sample();
    expect(after).toEqual(before);
    expect(before.state).toContain("2026");
    expect(before.generic).toContain("2026");
  });

  it("fitTitle needs an explicit year", () => {
    expect(fitTitle("Divorce Cost in California", 2026)).toContain("2026");
  });
});

describe("K3: sources do not read the global constant or the wall-clock year", () => {
  it.each(["src/app/sitemap.ts", "src/lib/seo.ts", "src/app/[state]/[slug]/page.tsx"])("%s", (file) => {
    const source = read(file);
    expect(source).not.toContain("DATA_VERSION_DATE");
    expect(source).not.toMatch(/new Date\(\)\.getFullYear\(\)/);
    expect(source).not.toMatch(/changeFrequency/);
  });
});
