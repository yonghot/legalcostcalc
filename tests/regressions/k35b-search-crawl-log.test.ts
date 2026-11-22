import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "../../middleware";

const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const INSPECTION = "Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)";
const GOOGLE_OTHER = "Mozilla/5.0 (compatible; GoogleOther)";
const BINGBOT = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
const BROWSER = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const MEDIAPARTNERS = "Mozilla/5.0 (compatible; Mediapartners-Google/2.1; +http://www.google.com/bot.html)";
const ADSBOT = "AdsBot-Google (+http://www.google.com/adsbot.html)";
const ADSBOT_WITH_GOOGLEBOT_TOKEN = "Mozilla/5.0 (compatible; AdsBot-Google; Googlebot/2.1)";

const call = (ua: string | null, url = "https://legalcostcalc.co/texas/divorce-cost?q=secret") => {
  const headers: Record<string, string> = { cookie: "session=abc" };
  if (ua !== null) headers["user-agent"] = ua;
  return middleware(new NextRequest(url, { headers }));
};

const lines = (log: { mock: { calls: unknown[][] } }, prefix: string) =>
  log.mock.calls.map((c) => String(c[0])).filter((l) => l.startsWith(prefix));

describe("K35-b search crawl log in the root middleware", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("logs one line per Google search crawler with ua google, path only", () => {
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "dpl_test");
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call(GOOGLEBOT);
    call(INSPECTION, "https://legalcostcalc.co/about");
    call(GOOGLE_OTHER, "https://legalcostcalc.co/");
    expect(log.mock.calls.map((c) => c[0])).toEqual([
      'search-crawl {"p":"/texas/divorce-cost","d":"dpl_test","ua":"google"}',
      'search-crawl {"p":"/about","d":"dpl_test","ua":"google"}',
      'search-crawl {"p":"/","d":"dpl_test","ua":"google"}',
    ]);
  });

  it("logs bingbot with ua bing and null when the deployment id is unset", () => {
    vi.stubEnv("VERCEL_DEPLOYMENT_ID", "");
    delete process.env.VERCEL_DEPLOYMENT_ID;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call(BINGBOT);
    expect(log.mock.calls.map((c) => c[0])).toEqual(['search-crawl {"p":"/texas/divorce-cost","d":null,"ua":"bing"}']);
  });

  it("logs nothing for a browser or a missing user agent", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call(BROWSER);
    call(null);
    expect(log).not.toHaveBeenCalled();
  });

  it("AdSense crawlers log only adsense-crawl, even with a Googlebot token in the string", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    call(MEDIAPARTNERS);
    call(ADSBOT);
    call(ADSBOT_WITH_GOOGLEBOT_TOKEN);
    expect(lines(log, "adsense-crawl")).toHaveLength(3);
    expect(lines(log, "search-crawl")).toHaveLength(0);
  });

  it("the response is the same as for a browser", () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const human = call(BROWSER);
    const bot = call(GOOGLEBOT);
    expect(bot.status).toBe(human.status);
    expect([...bot.headers.keys()].sort()).toEqual([...human.headers.keys()].sort());
    expect(bot.cookies.get("visitor_country")?.value).toBe(human.cookies.get("visitor_country")?.value);
  });
});
