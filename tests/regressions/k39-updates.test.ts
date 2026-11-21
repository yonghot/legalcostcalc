import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderPage } from "./helpers/render";
import UpdatesPage from "@/app/updates/page";
import { GET } from "@/app/updates/feed.xml/route";
import sitemap from "@/app/sitemap";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { formatDate } from "@/lib/content-dates";
import { SITE_UPDATES, type SiteUpdate } from "@/lib/site-updates";
import { buildUpdatesFeed } from "@/lib/updates-feed";

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const CADENCE = /\b(weekly|monthly|quarterly|biweekly|annually|regularly|periodically|every\s+(\d+|week|month|quarter|day|year|other))\b/i;

const commitDate = (sha: string): string | null => {
  try {
    return execFileSync("git", ["show", "-s", "--format=%cs", sha], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return null;
  }
};

export function evidenceProblems(u: SiteUpdate): string[] {
  const problems: string[] = [];
  if (u.commits.length === 0 && u.files.length === 0) problems.push("no evidence");
  for (const sha of u.commits) {
    const d = commitDate(sha);
    if (!d) problems.push(`commit ${sha} not found`);
    else if (d > u.date) problems.push(`commit ${sha} dated ${d} is after the entry date ${u.date}`);
  }
  for (const f of u.files) {
    const path = join(process.cwd(), f.path);
    if (!existsSync(path) || !readFileSync(path, "utf8").includes(f.marker)) problems.push(`marker ${f.marker} missing in ${f.path}`);
  }
  return problems;
}

describe("K39: update list", () => {
  it("has unique ids, valid dates, newest first", () => {
    const ids = SITE_UPDATES.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SITE_UPDATES.length).toBeGreaterThan(0);
    for (const u of SITE_UPDATES) {
      expect(u.date).toMatch(ISO);
      expect(new Date(`${u.date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(u.date);
    }
    const dates = SITE_UPDATES.map((u) => u.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it("every entry's evidence exists and is not dated after the entry", () => {
    for (const u of SITE_UPDATES) expect(evidenceProblems(u), u.id).toEqual([]);
  });

  it("promises no cadence", () => {
    for (const u of SITE_UPDATES) expect(`${u.title} ${u.body}`, u.id).not.toMatch(CADENCE);
  });

  it("positive controls: backdated entry, unknown commit and missing marker fail", () => {
    const real = SITE_UPDATES[0]!;
    expect(evidenceProblems({ ...real, date: "2000-01-01" }).length).toBeGreaterThan(0);
    expect(evidenceProblems({ ...real, commits: ["0000000"] }).length).toBeGreaterThan(0);
    expect(evidenceProblems({ ...real, commits: [], files: [{ path: "src/data/verified-fees.json", marker: "no-such-marker-xyz" }] }).length).toBeGreaterThan(0);
    expect(evidenceProblems({ ...real, commits: [], files: [] })).toContain("no evidence");
    expect("updated weekly").toMatch(CADENCE);
    expect("we review every 3 months").toMatch(CADENCE);
  });
});

describe("K39: feed, page and sitemap agree", () => {
  it("feed is Atom with one entry per update, newest date as feed updated", async () => {
    const xml = buildUpdatesFeed();
    expect(xml.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    expect((xml.match(/<entry>/g) ?? []).length).toBe(SITE_UPDATES.length);
    expect((xml.match(/<\/entry>/g) ?? []).length).toBe(SITE_UPDATES.length);
    for (const u of SITE_UPDATES) {
      expect(xml).toContain(`:${u.id}</id>`);
      expect(xml).toContain(`<updated>${u.date}T00:00:00Z</updated>`);
    }
    expect(xml).toContain(`<updated>${SITE_UPDATES[0]!.date}T00:00:00Z</updated>\n  <author>`);
    expect(CADENCE.test(xml)).toBe(false);
    const res = GET();
    expect(res.headers.get("content-type")).toContain("application/atom+xml");
    expect(await res.text()).toBe(xml);
  });

  it("page renders every entry with its date and links the feed", async () => {
    const html = await renderPage(UpdatesPage);
    for (const u of SITE_UPDATES) {
      expect(html).toContain(`id="${u.id}"`);
      expect(html).toContain(`dateTime="${u.date}"`);
      expect(html).toContain(formatDate(u.date, "day"));
      for (const sha of u.commits) expect(html).toContain(sha);
    }
    expect(html).toContain('href="/updates/feed.xml"');
  });

  it("sitemap lists /updates with lastmod equal to the newest entry", () => {
    const entry = sitemap().find((e) => e.url === `${CANONICAL_ORIGIN}/updates`);
    const lastmod = entry?.lastModified instanceof Date ? entry.lastModified.toISOString().slice(0, 10) : entry?.lastModified;
    expect(lastmod).toBe(SITE_UPDATES[0]!.date);
  });
});
