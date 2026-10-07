import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import TermsPage from "@/app/terms/page";
import StatisticsPage from "@/app/legal-cost-statistics/page";
import { DATA_LICENSE } from "@/lib/constants/data-license";

const visible = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

function ldNodes(html: string): Array<Record<string, unknown>> {
  return [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap((m) => {
    const parsed = JSON.parse(m[1]!.replace(/\\u003c/g, "<")) as unknown;
    return Array.isArray(parsed) ? parsed : [parsed];
  }) as Array<Record<string, unknown>>;
}

const section6 = (text: string) => {
  const start = text.indexOf("6. Intellectual Property");
  const end = text.indexOf("7. Third-Party Links");
  return start >= 0 && end > start ? text.slice(start, end) : "";
};

describe("LEGAL-31: the Dataset license and the Terms say the same thing", () => {
  it("the Dataset JSON-LD on the statistics page declares the license the Terms grant", async () => {
    const datasets = ldNodes(await renderPage(StatisticsPage)).filter((n) => n["@type"] === "Dataset");
    expect(datasets.length).toBeGreaterThan(0);
    for (const dataset of datasets) expect(dataset.license).toBe(DATA_LICENSE.url);
  });

  it("Terms section 6 grants that license for exactly the files the Dataset distributes, and for the embed", async () => {
    const stats = await renderPage(StatisticsPage);
    const dataset = ldNodes(stats).find((n) => n["@type"] === "Dataset")!;
    const distributions = (dataset.distribution as Array<{ contentUrl: string }>).map((d) => new URL(d.contentUrl).pathname);
    expect(distributions.length).toBeGreaterThanOrEqual(2);

    const html = await renderPage(TermsPage);
    const text = section6(visible(html));
    expect(text).not.toBe("");
    expect(html).toContain(`href="${DATA_LICENSE.url}"`);
    expect(text).toContain(DATA_LICENSE.shortName);
    for (const path of distributions) expect(text, path).toContain(path);
    expect(text).toMatch(/\/embed/);
  });

  it("Terms section 6 asks for credit to the publisher and a link to the license, and says no other content is licensed", async () => {
    const text = section6(visible(await renderPage(TermsPage)));
    expect(text).toMatch(/credit/i);
    expect(text).toMatch(/Actigence/);
    expect(text).toMatch(/link to the license/i);
    expect(text).toMatch(/change/i);
    expect(text).toMatch(/No other text, design, layout, or cost data on the Site is licensed/);
  });

  it("the prohibition on reproducing and scraping no longer applies to the licensed material", async () => {
    const text = section6(visible(await renderPage(TermsPage)));
    const prohibition = text.match(/[^.]*not reproduce, distribute, scrape[^.]*\./);
    expect(prohibition).not.toBeNull();
    expect(prohibition![0]).toMatch(/Except for the licensed material/);
  });

  it("the effective date moved with this content change", async () => {
    const text = visible(await renderPage(TermsPage));
    const match = text.match(/Effective date: ([A-Z][a-z]+ \d{1,2}, \d{4})/);
    expect(match).not.toBeNull();
    expect(Date.parse(`${match![1]} 12:00:00 UTC`)).toBeGreaterThanOrEqual(Date.parse("2026-10-08T00:00:00Z"));
  });
});
