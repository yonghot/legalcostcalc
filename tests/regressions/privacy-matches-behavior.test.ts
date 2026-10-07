import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";
import { renderPage } from "./helpers/render";
import PrivacyPage from "@/app/privacy/page";

const ROOT = join(__dirname, "..", "..");

const visible = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return /\.(tsx|ts)$/.test(name) ? [path] : [];
  });

const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("K5/K2: the privacy policy describes the site as it runs", () => {
  it("names Google Analytics 4 and Google AdSense and no longer mentions Plausible or env names", async () => {
    const raw = await renderPage(PrivacyPage);
    const html = visible(raw);
    expect(html).toMatch(/Google Analytics 4/);
    expect(html).toMatch(/Google AdSense/);
    expect(html).not.toMatch(/plausible/i);
    expect(html).not.toMatch(/NEXT_PUBLIC/);
    expect(html).not.toMatch(/localStorage/);
    expect(html).not.toMatch(/We do not collect names/i);
    expect(html).toMatch(/browser storage/i);
  });

  it("says what the contact form and the feedback widget collect", async () => {
    const html = visible(await renderPage(PrivacyPage));
    expect(html).toMatch(/contact form[^.]*name[^.]*email[^.]*message/i);
    expect(html).toMatch(/feedback widget[^.]*message[^.]*email[^.]*page URL[^.]*user.agent/i);
    expect(html).not.toMatch(/retained (?:only )?(?:for|as long as)|\b\d+\s+(?:days|months|years)\b/i);
  });

  it("explains the visitor_country cookie", async () => {
    const html = visible(await renderPage(PrivacyPage));
    expect(html).toMatch(/visitor_country/);
    expect(html).toMatch(/country/i);
    expect(html).toMatch(/one day|1 day|24 hours/i);
  });

  it("describes the consent behavior the site implements, per region", async () => {
    const html = visible(await renderPage(PrivacyPage));
    expect(html).toMatch(/European Economic Area|EEA/);
    expect(html).toMatch(/Google's consent message|Google’s consent message/);
    expect(html).toMatch(/denied by default/i);
    expect(html).toMatch(/allowed by default|granted by default/i);
    expect(html).toMatch(/Manage Consent/);
    expect(html).toMatch(/Decline|decline/);
    expect(html).not.toMatch(/via our cookie\/consent banner/i);
    expect(html).not.toMatch(/loaded only after consent/i);
    expect(html).not.toMatch(/does not use cookies for ad targeting/i);
  });

  it("covers interest-based ads and links Google's ad settings page", async () => {
    const raw = await renderPage(PrivacyPage);
    const html = visible(raw);
    expect(html).toMatch(/interest-based ads/i);
    expect(raw).toContain("https://adssettings.google.com");
    expect(raw).not.toContain("www.google.com/settings/ads");
  });

  it("every cookie and browser-storage key the code uses is named in the policy", async () => {
    const html = visible(await renderPage(PrivacyPage));
    const KEY = /\b(?:[A-Z_]*KEY|[A-Z_]*COOKIE|[A-Z_]*PREFIX)\s*=\s*"([a-z][a-z_]*)"/g;
    const found = new Map<string, string>();
    for (const file of walk(join(ROOT, "src"))) {
      const rel = relative(ROOT, file).split(sep).join("/");
      if (rel === "src/app/privacy/page.tsx") continue;
      for (const match of stripComments(readFileSync(file, "utf8")).matchAll(KEY)) {
        found.set(match[1]!, rel);
      }
    }
    expect([...found.keys()].sort()).toEqual(
      expect.arrayContaining([
        "cookie_consent",
        "visitor_country",
        "terms_gate_consent",
        "cc_state_",
        "cc_recent_calculations",
        "cc_traffic_type",
        "cc_referral_tagged",
        "cc_human_session",
      ]),
    );
    for (const [key, file] of found) {
      expect(html, `${key} (from ${file})`).toContain(key);
    }
  });

  it("every third-party host the site injects is named in the policy", async () => {
    const raw = await renderPage(PrivacyPage);
    const hosts = new Set<string>();
    for (const rel of [
      "src/components/consent/consented-analytics.tsx",
      "src/components/ads/adsense-loader.tsx",
    ]) {
      const code = stripComments(readFileSync(join(ROOT, rel), "utf8"));
      for (const match of code.matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})/g)) {
        const host = match[1]!.replace(/^www\./, "");
        if (host !== "legalcostcalc.co") hosts.add(host);
      }
    }
    expect(hosts.size).toBeGreaterThanOrEqual(2);
    for (const host of hosts) expect(raw, host).toContain(host);
  });

  it("shows one real effective date, not the stale July revision", async () => {
    const html = visible(await renderPage(PrivacyPage));
    const match = html.match(/Effective date: ([A-Z][a-z]+ \d{1,2}, \d{4})/);
    expect(match).not.toBeNull();
    expect(match![1]).not.toBe("July 2, 2026");
    const date = new Date(`${match![1]} 12:00:00 UTC`);
    expect(date.getTime()).toBeGreaterThanOrEqual(Date.parse("2026-10-07T00:00:00Z"));
    expect(date.getTime()).toBeLessThanOrEqual(Date.now() + 36 * 3600 * 1000);
  });
});
