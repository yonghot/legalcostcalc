import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("home publisher content", () => {
  const source = readFileSync(
    join(process.cwd(), "src/components/seo/home-publisher-content.tsx"),
    "utf8",
  );

  it("ships substantial server-rendered methodology, examples, limits, and sources", () => {
    expect(source).not.toMatch(/["']use client["']/);
    expect(source).not.toContain("<details");
    expect(source).toContain("How the estimate is built");
    expect(source).toContain("Two worked examples");
    expect(source).toContain("Assumptions and limits");
    expect(source).toContain(">Sources</h3>");
    expect(source.match(/[A-Za-z][A-Za-z'-]*/g)?.length ?? 0).toBeGreaterThanOrEqual(550);
  });
});
