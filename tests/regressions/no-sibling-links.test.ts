import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import HomePage from "@/app/page";
import StateCategoryPage from "@/app/[state]/[slug]/page";

const SRC = join(__dirname, "..", "..", "src");
const SIBLING_DOMAINS = /dentalcostfinder\.co|gofirepath\.com|launchcostcalc\.com|saascostx\.com/i;
const NETWORK_COPY = /free tools from our network|More Free Cost Calculators/i;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(tsx?|json|mjs)$/.test(name) ? [path] : [];
  });
}

const PAGES: Array<[string, () => Promise<string>]> = [
  ["/", () => renderPage(HomePage)],
  ["/california/divorce-cost", () => renderPage(StateCategoryPage, { state: "california", slug: "divorce-cost" })],
  ["/new-york/personal-injury-cost", () => renderPage(StateCategoryPage, { state: "new-york", slug: "personal-injury-cost" })],
  ["/texas/bankruptcy-cost", () => renderPage(StateCategoryPage, { state: "texas", slug: "bankruptcy-cost" })],
];

describe("K9: no unrelated sibling-network links on a legal-cost site", () => {
  it.each(PAGES)("%s links no sibling domain and has no network block", async (_path, render) => {
    const html = await render();
    expect(html).not.toMatch(SIBLING_DOMAINS);
    expect(html).not.toMatch(NETWORK_COPY);
  });

  it("no source file under src names a sibling domain", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => SIBLING_DOMAINS.test(readFileSync(f, "utf8")))
      .map((f) => f.slice(SRC.length + 1));
    expect(offenders).toEqual([]);
  });

  it("the sibling-network component and constant are gone", () => {
    expect(existsSync(join(SRC, "components", "seo", "related-calculators.tsx"))).toBe(false);
    expect(existsSync(join(SRC, "lib", "constants", "sibling-sites.ts"))).toBe(false);
  });
});
