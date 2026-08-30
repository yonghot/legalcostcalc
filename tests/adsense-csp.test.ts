import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AdSense CSP", () => {
  it("allows AdSense traffic-quality scripts in script-src", () => {
    const source = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    const adScript = source.match(/const adScript[\s\S]*?\n  : \"\";/)?.[0] ?? "";

    expect(adScript).toContain("https://*.adtrafficquality.google");
  });

  it("allows AdSense traffic-quality frames in frame-src", () => {
    const source = readFileSync(resolve(process.cwd(), "next.config.ts"), "utf8");
    const adFrame = source.match(/const adFrame[\s\S]*?\n  : \"\";/)?.[0] ?? "";

    expect(adFrame).toContain("https://*.adtrafficquality.google");
  });
});
