import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("native AdSense loader", () => {
  it("renders a parser-visible script instead of Next Script", () => {
    const source = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");

    expect(source).toMatch(/<script\s+[\s\S]*id="adsense-loader"/);
    expect(source).toContain("adsbygoogle.js?client=${normalizedCaPub}");
    expect(source).not.toMatch(/<Script\b/);
  });
});
