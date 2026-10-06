import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PUBLISHER } from "@/lib/constants/publisher";
import { ArticleSchema } from "@/components/seo/article-schema";
import { DatasetSchema } from "@/components/seo/dataset-schema";
import { OrganizationSchema } from "@/components/seo/organization-schema";
import { SoftwareApplicationSchema } from "@/components/seo/software-application-schema";

type Node = Record<string, unknown>;

function parse(html: string): Node[] {
  return [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].flatMap((m) => {
    const parsed = JSON.parse(m[1]) as Node;
    return Array.isArray(parsed["@graph"]) ? (parsed["@graph"] as Node[]) : [parsed];
  });
}

function isActigence(node: unknown): boolean {
  const n = node as Node;
  return n?.["@type"] === "Organization" && n.name === PUBLISHER.name && n.url === PUBLISHER.url;
}

const FORBIDDEN = /foundingDate|reviewedBy|lastReviewed|Editorial Team|source-verified|"@type":"Person"|@legalcostcalc\.co/;

describe("K6/K30: JSON-LD names Actigence as publisher and claims no review", () => {
  let original: string | undefined;
  beforeEach(() => {
    original = process.env.NEXT_PUBLIC_REVIEWER_NAME;
    delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
  });
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_REVIEWER_NAME;
    else process.env.NEXT_PUBLIC_REVIEWER_NAME = original;
  });

  const article = () =>
    renderToStaticMarkup(
      createElement(ArticleSchema, {
        headline: "H",
        description: "D",
        url: "https://legalcostcalc.co/california/divorce-cost",
        dateModified: "2026-06-29",
      }),
    );
  const software = () =>
    renderToStaticMarkup(
      createElement(SoftwareApplicationSchema, {
        name: "N",
        description: "D",
        url: "https://legalcostcalc.co/california/divorce-cost",
        dateModified: "2026-06-29",
      }),
    );
  const dataset = () =>
    renderToStaticMarkup(
      createElement(DatasetSchema, {
        name: "N",
        description: "D",
        url: "https://legalcostcalc.co/legal-cost-statistics",
        dateModified: "2026-06-29",
        distributionUrls: [{ url: "https://legalcostcalc.co/legal-cost-statistics/data.json", encodingFormat: "application/json" }],
      }),
    );
  const organization = () => renderToStaticMarkup(createElement(OrganizationSchema, {}));

  it("the organization graph has the Actigence Organization with its email and no self-referencing site Organization", () => {
    const nodes = parse(organization());
    const orgs = nodes.filter((n) => n["@type"] === "Organization");
    expect(orgs).toHaveLength(1);
    expect(isActigence(orgs[0])).toBe(true);
    expect(orgs[0].email).toBe(PUBLISHER.email);
    const site = nodes.find((n) => n["@type"] === "WebSite");
    expect(site?.name).toBe("LegalCostCalc");
    expect(isActigence(site?.publisher)).toBe(true);
  });

  it("Article author and publisher are the Actigence Organization", () => {
    const [node] = parse(article());
    expect(isActigence(node.author)).toBe(true);
    expect(isActigence(node.publisher)).toBe(true);
  });

  it("SoftwareApplication author and publisher are the Actigence Organization", () => {
    const [node] = parse(software());
    expect(isActigence(node.author)).toBe(true);
    expect(isActigence(node.publisher)).toBe(true);
  });

  it("Dataset creator and publisher are the Actigence Organization", () => {
    const [node] = parse(dataset());
    expect(isActigence(node.creator)).toBe(true);
    expect(isActigence(node.publisher)).toBe(true);
  });

  it("no emitted node carries a founding date, reviewer, review date, Person, team or site-domain email", () => {
    for (const [name, html] of Object.entries({
      organization: organization(),
      article: article(),
      software: software(),
      dataset: dataset(),
    })) {
      expect(html, name).not.toMatch(FORBIDDEN);
    }
  });

  it("a configured real reviewer changes only the Article author, never the publisher", () => {
    process.env.NEXT_PUBLIC_REVIEWER_NAME = "Jane Smith";
    const [node] = parse(article());
    expect((node.author as Node)["@type"]).toBe("Person");
    expect(isActigence(node.publisher)).toBe(true);
  });
});
