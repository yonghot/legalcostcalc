import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { renderPage } from "./helpers/render";
import StateCategoryPage from "@/app/[state]/[slug]/page";
import HomePage from "@/app/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import PrivacyPage from "@/app/privacy/page";
import GuidePage from "@/app/how-legal-fees-work/page";
import DivorceHubPage from "@/app/divorce-cost-by-state/page";
import { GET as getJson } from "@/app/legal-cost-statistics/data.json/route";
import { GET as getCsv } from "@/app/legal-cost-statistics/data.csv/route";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { AuthorByline } from "@/components/shared/author-byline";
import { dateLabel, getFamilyDate } from "@/lib/content-dates";
import { buildAnswerBlock } from "@/lib/seo/geo";
import { getCostForPage } from "@/lib/services/cost-service";
import { CATEGORY_MAP } from "@/lib/constants/categories";
import { STATE_BY_SLUG } from "@/lib/constants/states";

const text = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

const jsonLd = (html: string): Array<Record<string, unknown>> =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) =>
    JSON.parse(m[1]!.replace(/\\u003c/g, "<")),
  );

const OLD_DATE = /2026-06-29|June 29, 2026|Jun 29, 2026/;
const record = (key: string) => getFamilyDate(key)!;

describe("K3: a state page's dates all come from its cost family record", () => {
  const fam = record("cost:divorce");

  it("shows 'Updated October 2026' and no verified or June 29 wording", async () => {
    const raw = await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never);
    const html = text(raw);
    expect(fam.basis).toBe("content-changed");
    expect(fam.date).toBe("2026-10-07");
    expect(html).toContain("Updated October 2026");
    expect(html).toContain("Updated October 7, 2026");
    expect(html).not.toMatch(OLD_DATE);
    expect(html).not.toMatch(/Data verified|Last verified|Verified (?:June|October)/);
    expect(html).not.toMatch(/As of (?:June|October)/);
  });

  it("every JSON-LD dateModified equals the family date", async () => {
    const raw = await renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" } as never);
    const dates = jsonLd(raw).flatMap((node) => (node.dateModified ? [String(node.dateModified)] : []));
    expect(dates.length).toBeGreaterThanOrEqual(2);
    for (const date of dates) expect(date).toBe(fam.date);
    expect(raw).not.toContain("2026-06-29");
  });
});

describe("K3: statistics page, feeds and Dataset JSON-LD agree", () => {
  const fam = record("page:legal-cost-statistics");

  it("data.json and data.csv carry the family date under an updated-date name, not a verified-date name", async () => {
    const body = await (await getJson()).json();
    expect(body.dateUpdated).toBe(fam.date);
    expect(body).not.toHaveProperty("dataVerifiedDate");
    const csv = await (await getCsv()).text();
    const [header, ...rows] = csv.trim().split("\n");
    const columns = header!.split(",");
    expect(columns).toContain("date_updated");
    expect(columns).not.toContain("data_verified_date");
    expect(columns.at(-1)).toBe("date_updated");
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row.split(",").at(-1)).toBe(fam.date);
  });

  it("the page and its Dataset JSON-LD use the same date", async () => {
    const raw = await renderPage(StatisticsPage);
    const dataset = jsonLd(raw).find((n) => n["@type"] === "Dataset")!;
    expect(dataset.dateModified).toBe(fam.date);
    expect(text(raw)).toContain(dateLabel(fam));
    expect(raw).not.toMatch(OLD_DATE);
  });
});

describe("K3: no page prints the retired global date", () => {
  it.each([
    ["home", () => renderPage(HomePage)],
    ["privacy", () => renderPage(PrivacyPage)],
    ["guide", () => renderPage(GuidePage)],
    ["divorce hub", () => renderPage(DivorceHubPage)],
  ])("%s", async (_name, render) => {
    const raw = await render();
    expect(raw).not.toMatch(OLD_DATE);
  });

  it("the home page JSON-LD dateModified is the home record date", async () => {
    const raw = await renderPage(HomePage);
    const dates = jsonLd(raw).flatMap((node) => (node.dateModified ? [String(node.dateModified)] : []));
    for (const date of dates) expect(date).toBe(record("page:home").date);
  });

  it("the guide says 'last updated', not 'last reviewed', from its own record", async () => {
    const html = text(await renderPage(GuidePage));
    expect(html).not.toMatch(/Content last reviewed/i);
    expect(html).toContain("Content last updated");
    expect(html).toContain(record("guide").date);
  });
});

describe("K3: privacy keeps one date", () => {
  it("has the policy effective date and no data update date", async () => {
    const html = text(await renderPage(PrivacyPage));
    expect(html).toMatch(/Effective date: /);
    expect(html).not.toMatch(/Last data update/);
    expect((html.match(/Effective date:/g) ?? []).length).toBe(1);
  });
});

describe("K3: a missing record renders no date", () => {
  it("UpdatedBadge renders nothing without a record", () => {
    expect(renderToStaticMarkup(createElement(UpdatedBadge, { record: undefined }))).toBe("");
  });

  it("UpdatedBadge words the label by basis", () => {
    const changed = renderToStaticMarkup(
      createElement(UpdatedBadge, { record: { date: "2026-10-07", basis: "content-changed", evidence: "x" } }),
    );
    const checked = renderToStaticMarkup(
      createElement(UpdatedBadge, { record: { date: "2026-10-07", basis: "sources-rechecked", evidence: "x" } }),
    );
    expect(text(changed)).toContain("Updated October 2026");
    expect(text(checked)).toContain("Sources checked October 2026");
  });

  it("AuthorByline omits the date line when no date is given", () => {
    const html = text(renderToStaticMarkup(createElement(AuthorByline, { lastUpdated: null })));
    expect(html).not.toMatch(/Last updated|Sources checked/);
  });

  it("the answer block has no freshness label and no 'As of' prefix without a record", async () => {
    const costs = await getCostForPage("divorce", "CA");
    const block = buildAnswerBlock({
      category: CATEGORY_MAP.get("divorce")!,
      state: STATE_BY_SLUG.get("california")!,
      costs,
      dateRecord: null,
    });
    expect(block.freshnessLabel).toBeNull();
    expect(block.answer).not.toMatch(/^As of /);
  });

  it("an 'As of' prefix is only used for a source re-check", async () => {
    const costs = await getCostForPage("divorce", "CA");
    const base = { category: CATEGORY_MAP.get("divorce")!, state: STATE_BY_SLUG.get("california")!, costs };
    const changed = buildAnswerBlock({ ...base, dateRecord: record("cost:divorce") });
    const checked = buildAnswerBlock({
      ...base,
      dateRecord: { date: "2026-10-07", basis: "sources-rechecked", evidence: "x" },
    });
    expect(changed.answer).not.toMatch(/^As of /);
    expect(checked.answer).toMatch(/^As of October 7, 2026, /);
  });
});

describe("K3: the global date constant is gone from source", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const full = join(dir, name);
      return statSync(full).isDirectory() ? walk(full) : /\.(ts|tsx)$/.test(name) ? [full] : [];
    });

  it("no source file reads DATA_VERSION_DATE or DEFAULT_FIGURES_LAST_VERIFIED", () => {
    const offenders = walk(join(process.cwd(), "src")).filter((file) => {
      const source = readFileSync(file, "utf8");
      return /DATA_VERSION_DATE|DEFAULT_FIGURES_LAST_VERIFIED/.test(source);
    });
    expect(offenders).toEqual([]);
    expect(existsSync(join(process.cwd(), "src/lib/constants/data-meta.ts"))).toBe(false);
  });
});
