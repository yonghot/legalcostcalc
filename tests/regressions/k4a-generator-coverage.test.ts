import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/*
 * K4-a: every prose generator exported by state-context.ts must be exercised by a property test over all pages.
 * 10 of its 26 generators had no test that imported them when the first property file was written.
 */
const root = process.cwd();
const NOT_GENERATORS = new Set(["ordinal", "buildStateCostContext"]);

const exported = [...readFileSync(join(root, "src/lib/seo/state-context.ts"), "utf8").matchAll(/^export function (\w+)/gm)]
  .map((m) => m[1]!)
  .filter((name) => !NOT_GENERATORS.has(name));

const propertyFiles = readdirSync(join(root, "tests/regressions")).filter((f) => /^k4a-.*\.test\.ts$/.test(f) && f !== "k4a-generator-coverage.test.ts");

const uncovered = (sources: string[]) => exported.filter((name) => !sources.some((s) => new RegExp(`\\b${name}\\b`).test(s)));

describe("K4-a: every state-context prose generator has a property test", () => {
  it("finds the 26 generators and the property test files", () => {
    expect(exported.length).toBe(26);
    expect(propertyFiles.length).toBeGreaterThanOrEqual(4);
  });

  it("each generator is referenced by at least one k4a-*.test.ts file", () => {
    const sources = propertyFiles.map((f) => readFileSync(join(root, "tests/regressions", f), "utf8"));
    expect(uncovered(sources)).toEqual([]);
  });

  it("positive control: against the first property file alone the same check lists the ten generators that were missed", () => {
    const first = [readFileSync(join(root, "tests/regressions/k4a-prose-property.test.ts"), "utf8")];
    expect(uncovered(first).sort()).toEqual(
      [
        "assumptionItems",
        "bandSentence",
        "calculationBlocks",
        "calibrationSentence",
        "escalationSentence",
        "extraCalculations",
        "hoursSentence",
        "overlapSentence",
        "premiumSentence",
        "tempoSentence",
      ].sort(),
    );
  });
});
