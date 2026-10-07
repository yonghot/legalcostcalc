import { describe, expect, it } from "vitest";
import { classifyReferralSource } from "@/lib/analytics";

const NOT_AI = { kind: null, source: null };

describe("K34: a Bing referrer is AI only when the path says so", () => {
  it.each([
    "https://www.bing.com/",
    "https://bing.com/",
    "https://www.bing.com/search?q=legal+fees",
    "https://www.bing.com/search?q=divorce+cost+california&form=QBLH",
    "https://cn.bing.com/search?q=x",
    "https://www.bing.com/images/search?q=x",
  ])("%s is ordinary search, not AI", (referrer) => {
    expect(classifyReferralSource(referrer)).toEqual(NOT_AI);
  });

  it.each(["https://www.bing.com/chat", "https://www.bing.com/chat?q=x", "https://www.bing.com/search/ai"])(
    "%s is Copilot",
    (referrer) => {
      expect(classifyReferralSource(referrer)).toEqual({ kind: "ai", source: "copilot" });
    },
  );

  it("copilot.microsoft.com is still Copilot", () => {
    expect(classifyReferralSource("https://copilot.microsoft.com/")).toEqual({ kind: "ai", source: "copilot" });
  });

  it("a lookalike host is not Bing", () => {
    expect(classifyReferralSource("https://notbing.com/chat")).toEqual(NOT_AI);
    expect(classifyReferralSource("https://www.bing.com.example.net/chat")).toEqual(NOT_AI);
  });

  it("the other engines are unchanged", () => {
    expect(classifyReferralSource("https://chatgpt.com/")).toEqual({ kind: "ai", source: "chatgpt" });
    expect(classifyReferralSource("https://www.perplexity.ai/search?q=x")).toEqual({ kind: "ai", source: "perplexity" });
    expect(classifyReferralSource("https://gemini.google.com/app")).toEqual({ kind: "ai", source: "gemini" });
  });
});
