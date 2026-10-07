import { afterEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { readFileSync } from "node:fs";
import path from "node:path";
import { renderPage } from "./helpers/render";
import sitemap from "@/app/sitemap";
import HomePage from "@/app/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { INDEXED_PAGES } from "@/lib/index-policy";
import { CATEGORIES } from "@/lib/constants/categories";

const ANCHOR = /<a\b[^>]*\bhref="([^"]+)"/g;

function block(html: string, placement: string): string {
  const match = html.match(new RegExp(String.raw`<section[^>]*data-next-step="${placement}"[\s\S]*?</section>`));
  expect(match, `data-next-step="${placement}" block`).not.toBeNull();
  return match![0];
}

const hrefs = (html: string) => [...html.matchAll(ANCHOR)].map((m) => m[1]);

const listed = new Set(
  sitemap().map((e) => {
    const p = e.url.replace(CANONICAL_ORIGIN, "");
    return p === "" ? "/" : p;
  }),
);

describe("UX P0-3: a server-rendered Next steps block follows the answer on every matter page", () => {
  it("Massachusetts bankruptcy: three internal anchors, after the figures and before the calculator", async () => {
    const html = await renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" });
    const ns = block(html, "answer");
    const links = hrefs(ns);
    expect(links).toHaveLength(3);
    for (const href of links) expect(href.startsWith("/"), href).toBe(true);
    const at = html.indexOf('data-next-step="answer"');
    expect(at).toBeGreaterThan(html.indexOf("(Moderate Complexity)"));
    expect(at).toBeLessThan(html.indexOf("Calculate Your Estimated Cost"));
    expect(at).toBeLessThan(html.indexOf('data-ad-exclusion-zone="calculator-widget"'));
  });

  it("the compare step points at the other state with measured visits, never at the page itself", async () => {
    const ma = block(await renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" }), "answer");
    expect(hrefs(ma)).toContain("/florida/bankruptcy-cost");
    expect(hrefs(ma)).not.toContain("/massachusetts/bankruptcy-cost");
    const fl = block(await renderPage(StateCategoryPage, { state: "florida", slug: "bankruptcy-cost" }), "answer");
    expect(hrefs(fl)).toContain("/massachusetts/bankruptcy-cost");
    expect(hrefs(fl)).not.toContain("/florida/bankruptcy-cost");
  });

  it("a matter with no other measured page falls back to the compare tool", async () => {
    const ns = block(await renderPage(StateCategoryPage, { state: "michigan", slug: "estate-planning-cost" }), "answer");
    expect(hrefs(ns)).toContain("/compare");
  });

  it("personal injury leads with the settlement estimator", async () => {
    const ns = block(await renderPage(StateCategoryPage, { state: "texas", slug: "personal-injury-cost" }), "answer");
    expect(hrefs(ns)[0]).toBe("/settlement-estimator");
    expect(hrefs(ns)).toHaveLength(3);
  });

  it("every step on every matter, for a kept page of each matter, links a listed page and no external host", async () => {
    const onePerMatter = CATEGORIES.flatMap((c) => INDEXED_PAGES.find((p) => p.category.slug === c.slug) ?? []);
    expect(onePerMatter.length).toBeGreaterThanOrEqual(6);
    for (const page of onePerMatter) {
      const html = await renderPage(StateCategoryPage, { state: page.state.slug, slug: `${page.category.slug}-cost` });
      const links = hrefs(block(html, "answer"));
      expect(links.length, page.path).toBeGreaterThanOrEqual(2);
      expect(links.length, page.path).toBeLessThanOrEqual(3);
      for (const href of links) {
        expect(href.startsWith("/"), `${page.path} -> ${href}`).toBe(true);
        expect(listed.has(href), `${page.path} -> ${href}`).toBe(true);
      }
    }
  });

  it("the other-states list leads with the states that have measured visits, not the alphabet", async () => {
    const html = await renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" });
    const section = html.match(/Bankruptcy Cost in Other States[\s\S]*?<\/section>/)![0];
    const states = hrefs(section).filter((h) => /^\/[a-z-]+\/bankruptcy-cost$/.test(h));
    expect(states.slice(0, 3)).toEqual(["/florida/bankruptcy-cost", "/california/bankruptcy-cost", "/colorado/bankruptcy-cost"]);
  });

  it("the home page carries a server-rendered block with the most visited page, the guide and the compare tool", async () => {
    const ns = block(await renderPage(HomePage), "home");
    expect(hrefs(ns)).toEqual(["/massachusetts/bankruptcy-cost", "/how-legal-fees-work", "/compare"]);
  });

  it("matter pages and home leave no link to an unrelated sibling domain", async () => {
    const pages = [await renderPage(HomePage), await renderPage(StateCategoryPage, { state: "massachusetts", slug: "bankruptcy-cost" })];
    for (const html of pages) {
      expect(hrefs(html).filter((h) => /dentalcostfinder|gofirepath|launchcostcalc|saascostx/.test(h))).toEqual([]);
    }
  });
});

describe("UX P0-3: clicks reuse related_click with the shared next_step module", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("each click sends link_module next_step, a placement-and-slot context and the path only", async () => {
    const calls: unknown[][] = [];
    vi.stubGlobal("window", { localStorage: { getItem: () => null }, gtag: (...args: unknown[]) => calls.push(args) });
    const { NextSteps } = await import("@/components/calculator/next-steps");
    const { pageNextSteps } = await import("@/lib/next-steps-server");
    const steps = pageNextSteps({
      stateSlug: "massachusetts",
      stateName: "Massachusetts",
      categorySlug: "bankruptcy",
      categoryName: "Bankruptcy",
      moderateMedian: 4400,
      moderateLow: 2000,
      moderateHigh: 9000,
    });
    const links: Array<{ href: string; onClick: () => void }> = [];
    const walk = (node: ReactNode): void => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!isValidElement(node)) return;
      const props = (node as ReactElement<{ href?: string; onClick?: () => void; children?: ReactNode }>).props;
      if (typeof props.href === "string" && typeof props.onClick === "function") links.push({ href: props.href, onClick: props.onClick });
      walk(props.children);
    };
    walk(NextSteps({ steps, placement: "answer" }));
    expect(links).toHaveLength(3);
    for (const link of links) link.onClick();
    expect(calls).toHaveLength(3);
    for (const call of calls as Array<[string, string, Record<string, unknown>]>) {
      expect(call[1]).toBe("related_click");
      expect(Object.keys(call[2]).sort()).toEqual(["link_context", "link_module", "link_url", "site"]);
      expect(call[2].link_module).toBe("next_step");
    }
    expect((calls as Array<[string, string, Record<string, unknown>]>).map((c) => c[2].link_context)).toEqual([
      "answer_state_compare",
      "answer_guide",
      "answer_category_hub",
    ]);
  });

  it("no separate next_step_click event name remains in source", () => {
    const root = path.resolve(__dirname, "..", "..", "src");
    const files = ["lib/analytics.ts", "components/calculator/next-steps.tsx"];
    for (const file of files) expect(readFileSync(path.join(root, file), "utf8")).not.toContain("next_step_click");
  });
});
