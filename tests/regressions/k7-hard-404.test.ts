import { describe, expect, it } from "vitest";
import "./helpers/render";
import * as slugRoute from "@/app/[state]/[slug]/page";
import * as stateRoute from "@/app/[state]/page";
import * as categoryRoute from "@/app/category/[category]/page";
import * as embedRoute from "@/app/embed/[state]/[slug]/page";
import costsSeed from "@/data/seed/costs.json";

type SeedRow = { state_code: string; category: string };

const SEED_PAIRS = new Set((costsSeed as SeedRow[]).map((r) => `${r.state_code}:${r.category}`));
const SEED_STATES = new Set((costsSeed as SeedRow[]).map((r) => r.state_code));
const SEED_CATEGORIES = new Set((costsSeed as SeedRow[]).map((r) => r.category));

interface DynamicRoute {
  dynamicParams?: boolean;
  generateStaticParams: () => Promise<Array<Record<string, string>>> | Array<Record<string, string>>;
  generateMetadata: (props: { params: Promise<Record<string, string>> }) => Promise<{ robots?: unknown }>;
}

const ROUTES: Array<[string, DynamicRoute]> = [
  ["/[state]/[slug]", slugRoute as unknown as DynamicRoute],
  ["/[state]", stateRoute as unknown as DynamicRoute],
  ["/category/[category]", categoryRoute as unknown as DynamicRoute],
  ["/embed/[state]/[slug]", embedRoute as unknown as DynamicRoute],
];

describe("K7: unknown paths under the dynamic routes are real 404s", () => {
  it.each(ROUTES)("%s exports dynamicParams = false", (_name, route) => {
    expect(route.dynamicParams).toBe(false);
  });

  it("the seed covers 51 states and 8 categories", () => {
    expect(SEED_STATES.size).toBe(51);
    expect(SEED_CATEGORIES.size).toBe(8);
    expect(SEED_PAIRS.size).toBe(408);
  });

  it.each([
    ["/[state]/[slug]", slugRoute],
    ["/embed/[state]/[slug]", embedRoute],
  ] as const)("%s statically generates exactly the 408 valid state and matter pairs", async (_name, route) => {
    const params = (await (route as unknown as DynamicRoute).generateStaticParams()) as Array<{
      state: string;
      slug: string;
    }>;
    expect(params).toHaveLength(408);
    expect(new Set(params.map((p) => `${p.state}/${p.slug}`)).size).toBe(408);
    expect(params.every((p) => /^[a-z-]+$/.test(p.state) && /^[a-z-]+-cost$/.test(p.slug))).toBe(true);
    expect(params).toContainEqual({ state: "california", slug: "divorce-cost" });
    expect(params).toContainEqual({ state: "district-of-columbia", slug: "personal-injury-cost" });
    expect(params).not.toContainEqual({ state: "texas", slug: "not-a-real-cost" });
    expect(params.some((p) => p.slug === "divorce")).toBe(false);
  });

  it("/[state] statically generates the 51 state slugs", async () => {
    const params = (await stateRoute.generateStaticParams()) as Array<{ state: string }>;
    expect(params).toHaveLength(51);
    expect(new Set(params.map((p) => p.state)).size).toBe(51);
    expect(params).toContainEqual({ state: "california" });
    expect(params).not.toContainEqual({ state: "not-a-state" });
  });

  it("/category/[category] statically generates the 8 matter categories", async () => {
    const params = (await categoryRoute.generateStaticParams()) as Array<{ category: string }>;
    expect(params.map((p) => p.category).sort()).toEqual([...SEED_CATEGORIES].sort());
  });

  it.each([
    ["/[state]/[slug]", slugRoute, { state: "texas", slug: "not-a-real-cost" }],
    ["/[state]/[slug]", slugRoute, { state: "nowhere", slug: "divorce-cost" }],
    ["/[state]", stateRoute, { state: "nowhere" }],
    ["/category/[category]", categoryRoute, { category: "nothing" }],
  ] as const)("%s metadata for an unknown path is noindex,nofollow, not the inherited index,follow", async (_name, route, p) => {
    const meta = await (route as unknown as DynamicRoute).generateMetadata({ params: Promise.resolve(p) });
    expect(meta.robots).toMatchObject({ index: false, follow: false });
  });
});
