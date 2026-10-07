import { afterEach, describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { renderPage } from "./helpers/render";
import { INDEXABLE_PAGES, PAGE_INDEX } from "@/lib/page-index";
import { STATES } from "@/lib/constants/states";
import StateHubPage, { generateMetadata as hubMetadata } from "@/app/[state]/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";

const COST_HREF = /href="(\/[a-z-]+\/[a-z-]+-cost)"/g;

function costLinks(html: string): string[] {
  return [...new Set([...html.matchAll(COST_HREF)].map((m) => m[1]))];
}

async function renderSpoke(statePath: { state: string; slug: string }): Promise<string> {
  const { default: Page } = await import("@/app/[state]/[slug]/page");
  const element = await Page({ params: Promise.resolve(statePath) });
  return renderToStaticMarkup(createElement("div", null, element));
}

const unique = PAGE_INDEX.filter((p) => p.hasUniqueData);
const gated = PAGE_INDEX.filter((p) => !p.hasUniqueData);

describe("K10/K24: RelatedLinks only links pages that pass the index policy", () => {
  afterEach(() => {
    vi.doUnmock("@/data/index-policy.json");
    vi.resetModules();
  });

  it("with the shipped policy 'other legal costs' omit a matter the state has no passing page for", async () => {
    const missing = gated[0];
    const own = unique.find((p) => p.state.code === missing.state.code)!;
    const html = await renderPage(StateCategoryPage, { state: own.state.slug, slug: `${own.category.slug}-cost` });
    const linked = costLinks(html);
    expect(linked.length).toBeGreaterThan(0);
    expect(linked).not.toContain(missing.path);
  });

  it("with the shipped policy 'in other states' omit a state with no passing page for the matter", async () => {
    const earlyIndex = (code: string) => STATES.findIndex((s) => s.code === code);
    const missing = gated.find((p) => earlyIndex(p.state.code) < 6)!;
    const own = unique.find((p) => p.category.slug === missing.category.slug && earlyIndex(p.state.code) > 6)!;
    const html = await renderPage(StateCategoryPage, { state: own.state.slug, slug: `${own.category.slug}-cost` });
    const linked = costLinks(html);
    expect(linked.length).toBeGreaterThan(0);
    expect(linked).not.toContain(missing.path);
  });

  it("with an injected keep policy the related blocks name only kept pages and the hub link keeps the real count", async () => {
    const own = unique.find((p) => p.state.slug === "california" && p.category.slug === "divorce")!;
    const keptOther = [
      unique.find((p) => p.state.slug === "california" && p.category.slug === "dui")!,
      unique.find((p) => p.state.slug === "texas" && p.category.slug === "divorce")!,
    ];
    const keep = [own.path, ...keptOther.map((p) => p.path)];
    vi.resetModules();
    vi.doMock("@/data/index-policy.json", () => ({ default: { keep, noindex: [], exceptions: [] } }));

    const html = await renderSpoke({ state: own.state.slug, slug: `${own.category.slug}-cost` });
    const linked = costLinks(html).filter((href) => href !== own.path);
    expect(linked.sort()).toEqual(keptOther.map((p) => p.path).sort());

    const hubCount = INDEXABLE_PAGES.filter((p) => p.category.slug === "divorce").length;
    expect(html).toContain(`View all ${hubCount} states`);
    expect(html).toContain('href="/category/divorce"');
  });
});

describe("K10/K20: state hubs state the number of matters they list", () => {
  it.each(STATES.map((s) => [s.slug, s.code] as const))("%s: text count equals the number of View details links", async (slug, code) => {
    const listed = INDEXABLE_PAGES.filter((p) => p.state.code === code).length;
    const html = await renderPage(StateHubPage, { state: slug });
    const text = html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const stated = text.match(/legal costs for (\d+) (?:common )?matter types? in/);
    expect(stated, slug).not.toBeNull();
    expect(Number(stated![1])).toBe(listed);
    expect((html.match(/View details/g) ?? []).length).toBe(listed);
    const meta = await hubMetadata({ params: Promise.resolve({ state: slug }) });
    expect(String(meta.description)).toContain(`across ${listed} matter type${listed === 1 ? "" : "s"} in`);
  });
});
