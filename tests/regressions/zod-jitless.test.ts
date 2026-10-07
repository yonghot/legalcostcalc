import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const SCHEMA_MODULE = join(__dirname, "..", "..", "src", "lib", "utils", "email-results-validation.ts");

describe("zod v4 jitless", () => {
  it("is switched on by importing the validation modules", async () => {
    expect(z.core.globalConfig.jitless).toBeUndefined();
    const { EmailResultsSchema } = await import("@/lib/utils/email-results-validation");
    await import("@/lib/utils/feedback-validation");
    expect(z.core.globalConfig.jitless).toBe(true);
    const parsed = EmailResultsSchema.parse({
      email: "  Reader@Example.com ",
      calcType: "divorce",
      shareUrl: "https://legalcostcalc.co/california/divorce-cost",
    });
    expect(parsed).toMatchObject({ email: "reader@example.com", marketingOptIn: false });
  });

  it("is configured before the first schema is defined", () => {
    const source = readFileSync(SCHEMA_MODULE, "utf8");
    const config = source.indexOf("z.config({ jitless: true })");
    expect(config).toBeGreaterThan(-1);
    expect(config).toBeLessThan(source.indexOf("z.object("));
  });
});
