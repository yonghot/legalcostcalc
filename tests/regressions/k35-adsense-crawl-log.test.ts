import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "../../middleware";

const call = (ua: string | null, url = "https://legalcostcalc.co/texas/divorce-cost?q=secret") => {
  const headers: Record<string, string> = { cookie: "session=abc" };
  if (ua !== null) headers["user-agent"] = ua;
  return middleware(new NextRequest(url, { headers }));
};

describe("K35 AdSense crawl log in the root middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs one line for Mediapartners-Google and AdsBot-Google with path, deployment id and a short ua label only", () => {
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "dpl_test");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call("Mediapartners-Google");
    call("AdsBot-Google (+http://www.google.com/adsbot.html)");
    expect(log.mock.calls.map((c) => c[0])).toEqual([
      'adsense-crawl {"p":"/texas/divorce-cost","d":"dpl_test","ua":"mp"}',
      'adsense-crawl {"p":"/texas/divorce-cost","d":"dpl_test","ua":"adsbot"}',
    ]);
  });

  it("logs nothing for other user agents or none, and the response is the same", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const bot = call("Mediapartners-Google");
    const human = call("Mozilla/5.0 Chrome/120");
    const none = call(null);
    expect(log).toHaveBeenCalledTimes(1);
    expect(human.status).toBe(bot.status);
    expect([...human.headers.keys()].sort()).toEqual([...bot.headers.keys()].sort());
    expect(none.status).toBe(200);
  });

  it("writes null when the deployment id is unset", () => {
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "");
    delete process.env.VERCEL_DEPLOYMENT_ID;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call("Mediapartners-Google");
    expect(log.mock.calls[0][0]).toContain('"d":null');
  });

  it("the matcher covers HTML page routes", () => {
    const re = new RegExp("^" + config.matcher[0] + "$");
    for (const p of ["/", "/texas", "/texas/divorce-cost", "/about"]) expect(re.test(p)).toBe(true);
  });
});
