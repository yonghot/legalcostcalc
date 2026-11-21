import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { decideGaLoad } from "@/lib/ga-gate";

const APP = "https://legalcostcalc.co";
const gate = (over: Partial<Parameters<typeof decideGaLoad>[0]>) =>
  decideGaLoad({ appUrl: APP, vercelEnv: "production", gaDebug: undefined, hostname: "legalcostcalc.co", ...over });

describe("K20: GA loads only in production on the canonical host, else only with GA_DEBUG=1", () => {
  it("production on the canonical host and on www loads normally", () => {
    expect(gate({})).toEqual({ shouldLoad: true, debugMode: false });
    expect(gate({ hostname: "www.legalcostcalc.co" })).toEqual({ shouldLoad: true, debugMode: false });
  });

  it("production on any other host does not load", () => {
    for (const hostname of ["localhost", "legalcostcalc-git-x.vercel.app", "mirror.example.com", "legalcostcalc.co.evil.test", "sub.legalcostcalc.co"]) {
      expect(gate({ hostname }), hostname).toEqual({ shouldLoad: false, debugMode: false });
    }
  });

  it("a non-production environment does not load even on the canonical host", () => {
    for (const vercelEnv of ["preview", "development", "", undefined]) {
      expect(gate({ vercelEnv }), String(vercelEnv)).toEqual({ shouldLoad: false, debugMode: false });
    }
  });

  it("GA_DEBUG=1 opts a preview or localhost deploy in, in debug mode only", () => {
    expect(gate({ vercelEnv: "preview", gaDebug: "1", hostname: "x.vercel.app" })).toEqual({ shouldLoad: true, debugMode: true });
    expect(gate({ vercelEnv: undefined, gaDebug: "1", hostname: "localhost" })).toEqual({ shouldLoad: true, debugMode: true });
    for (const gaDebug of ["0", "true", "", undefined]) {
      expect(gate({ vercelEnv: "preview", gaDebug, hostname: "x.vercel.app" }), String(gaDebug)).toEqual({ shouldLoad: false, debugMode: false });
    }
  });

  it("production on the canonical host never reports debug mode, even with GA_DEBUG=1", () => {
    expect(gate({ gaDebug: "1" })).toEqual({ shouldLoad: true, debugMode: false });
  });

  it("an empty or invalid app URL falls back to the canonical host", () => {
    expect(gate({ appUrl: "" })).toEqual({ shouldLoad: true, debugMode: false });
    expect(gate({ appUrl: "not a url" })).toEqual({ shouldLoad: true, debugMode: false });
    expect(gate({ appUrl: "https://example.org", hostname: "example.org" })).toEqual({ shouldLoad: true, debugMode: false });
    expect(gate({ appUrl: "https://example.org", hostname: "legalcostcalc.co" })).toEqual({ shouldLoad: false, debugMode: false });
  });

  it("with no window there is no hostname and nothing loads", () => {
    expect(gate({ hostname: undefined })).toEqual({ shouldLoad: false, debugMode: false });
  });

  it("the component passes the three NEXT_PUBLIC values as literal reads so the bundler can inline them", () => {
    const src = readFileSync(join(__dirname, "..", "..", "src", "components", "consent", "consented-analytics.tsx"), "utf8");
    for (const name of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_GA_DEBUG"]) {
      expect(src).toContain(`process.env.${name}`);
    }
    expect(src).toContain("decideGaLoad({");
  });
});
