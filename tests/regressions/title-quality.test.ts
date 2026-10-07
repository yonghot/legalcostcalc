import { describe, expect, it } from "vitest";
import type { Metadata } from "next";
import "./helpers/render";
import { resolveTitle } from "./helpers/title";
import { metadata as rootMetadata } from "@/app/layout";
import { generateMetadata as stateHubMetadata } from "@/app/[state]/page";
import { generateMetadata as stateCategoryMetadata } from "@/app/[state]/[slug]/page";
import { generateMetadata as categoryHubMetadata } from "@/app/category/[category]/page";
import { generateMetadata as divorceHubMetadata } from "@/app/divorce-cost-by-state/page";
import { generateMetadata as statisticsMetadata } from "@/app/legal-cost-statistics/page";
import { generateMetadata as searchMetadata } from "@/app/search/page";
import { metadata as aboutMetadata } from "@/app/about/page";
import { metadata as contactMetadata } from "@/app/contact/page";
import { metadata as privacyMetadata } from "@/app/privacy/page";
import { metadata as termsMetadata } from "@/app/terms/page";
import { metadata as embedIndexMetadata } from "@/app/embed/page";
import { metadata as guideMetadata } from "@/app/how-legal-fees-work/page";
import { metadata as settlementMetadata } from "@/app/settlement-estimator/page";
import { metadata as compareMetadata } from "@/app/compare/layout";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { SITE_NAME, buildMeta, fitTitle } from "@/lib/seo";

const ROOT = rootMetadata.title as { default: string; template: string };
const MAX = 60;

interface Entry {
  route: string;
  title: string;
  core?: string;
}

async function collect(): Promise<Entry[]> {
  const out: Entry[] = [];
  const add = (route: string, meta: Metadata, core?: string) =>
    out.push({ route, title: resolveTitle(meta.title, ROOT), core });

  out.push({ route: "/", title: resolveTitle(undefined, ROOT) });
  for (const state of STATES) {
    add(`/${state.slug}`, await stateHubMetadata({ params: Promise.resolve({ state: state.slug }) }), `Legal Costs in ${state.name}`);
    for (const category of CATEGORIES) {
      add(
        `/${state.slug}/${category.slug}-cost`,
        await stateCategoryMetadata({ params: Promise.resolve({ state: state.slug, slug: `${category.slug}-cost` }) }),
        `${category.displayName} Cost in ${state.name}`,
      );
    }
  }
  for (const category of CATEGORIES) {
    add(
      `/category/${category.slug}`,
      await categoryHubMetadata({ params: Promise.resolve({ category: category.slug }) }),
      `${category.displayName} Cost by State`,
    );
  }
  add("/divorce-cost-by-state", await divorceHubMetadata());
  add("/legal-cost-statistics", await statisticsMetadata());
  add("/search", await searchMetadata({ searchParams: Promise.resolve({}) }));
  add("/about", aboutMetadata);
  add("/contact", contactMetadata);
  add("/privacy", privacyMetadata);
  add("/terms", termsMetadata);
  add("/embed", embedIndexMetadata);
  add("/how-legal-fees-work", guideMetadata);
  add("/settlement-estimator", settlementMetadata);
  add("/compare", compareMetadata);
  return out;
}

const brandCount = (title: string) => title.split(SITE_NAME).length - 1;

describe("K17: every page title fits without truncation or a doubled brand", () => {
  it("enumerates every route family (home, 51 hubs, 8 category hubs, 408 matter pages, static pages)", async () => {
    const entries = await collect();
    expect(entries.length).toBe(1 + 51 + 51 * 8 + 8 + 11);
  });

  it("no resolved title is longer than 60 characters", async () => {
    const tooLong = (await collect())
      .filter((e) => e.title.length > MAX)
      .map((e) => `${e.title.length} ${e.route} ${e.title}`);
    expect(tooLong).toEqual([]);
  });

  it("no double space, dangling '&' or '—', stray entity, or second separator", async () => {
    const bad = (await collect())
      .filter(
        (e) =>
          /\s{2,}/.test(e.title) ||
          /[&—\-:]\s*$/.test(e.title) ||
          /&amp;|&#/.test(e.title) ||
          e.title.split("—").length - 1 > 1,
      )
      .map((e) => `${e.route} ${e.title}`);
    expect(bad).toEqual([]);
  });

  it("the brand appears at most once, and is left out only when it cannot fit in 60 characters", async () => {
    const bad = (await collect())
      .filter((e) => {
        const n = brandCount(e.title);
        return n > 1 || (n === 0 && e.route !== "/" && `${e.title} — ${SITE_NAME}`.length <= MAX);
      })
      .map((e) => `${e.route} ${e.title}`);
    expect(bad).toEqual([]);
  });

  it("generated pages keep their keyword-first core and a single stable pattern", async () => {
    const generated = (await collect()).filter((e) => e.core);
    expect(generated.length).toBe(51 + 51 * 8 + 8);
    const bad = generated
      .filter((e) => {
        const core = e.core as string;
        const escaped = core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return !new RegExp(`^${escaped}( \\(\\d{4}\\))?( — ${SITE_NAME})?$`).test(e.title);
      })
      .map((e) => `${e.route} ${e.title}`);
    expect(bad).toEqual([]);
  });

  it("most generated titles carry both the year and the brand", async () => {
    const generated = (await collect()).filter((e) => e.core);
    const full = generated.filter((e) => /\(\d{4}\) — LegalCostCalc$/.test(e.title));
    expect(full.length).toBeGreaterThan(generated.length * 0.75);
  });
});

describe("K17: buildMeta emits an absolute title so the layout template cannot append the brand again", () => {
  it("generated and fixed titles are both { absolute }", () => {
    for (const skipFit of [false, true]) {
      const meta = buildMeta({ title: "Divorce Cost in California", description: "d", path: "/x", skipFit });
      expect(meta.title).toEqual({ absolute: expect.any(String) });
    }
  });

  it("fitTitle never cuts a word and keeps the whole core", () => {
    const longest = "Estate Planning / Probate Cost in District of Columbia";
    const title = fitTitle(longest, 2026);
    expect(title.startsWith(longest)).toBe(true);
    expect(title.length).toBeLessThanOrEqual(MAX);
  });

  it("open graph and twitter titles equal the page title", () => {
    const meta = buildMeta({ title: "Divorce Cost in California", description: "d", path: "/x" });
    const title = (meta.title as { absolute: string }).absolute;
    expect(meta.openGraph?.title).toBe(title);
    expect(meta.twitter?.title).toBe(title);
  });
});
