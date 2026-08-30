import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdSense CSP", () => {
  it("allows AdSense traffic-quality configuration", () => {
    expect(readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8")).toContain(
      "https://*.adtrafficquality.google",
    );
  });
});
