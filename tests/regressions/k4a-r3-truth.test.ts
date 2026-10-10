import { describe, expect, it } from "vitest";
import { hoursRankSentence, hoursSentence } from "@/lib/seo/state-context";
import { collect, middle, tierRow, seedTable, type Page } from "./helpers/k4a-oracle";

/*
 * Adversarial review round 3 (r3-truth-*): sentences whose claim the page's own numbers contradict.
 */

const hoursOf = (row: { median: number; rate: number } | undefined) => (row && row.rate > 0 ? Math.round(row.median / row.rate) : null);
const peerHours = (p: Page) =>
  middle(
    seedTable(p.category, "moderate")
      .filter((r) => r.rate > 0)
      .map((r) => Math.round(r.median / r.rate)),
  );

describe("r3-truth-R3-TXT-01: the hours-rank sentence makes no workload claim the hours sentence contradicts", () => {
  it("'more work behind' needs hours above the peer median and 'fewer implied hours' needs hours below it", () => {
    let seen = 0;
    const v = collect((p) => {
      const text = hoursRankSentence(p.ctx, p.label);
      if (!text) return [];
      seen++;
      const own = hoursOf(tierRow(p, "moderate"))!;
      const peer = peerHours(p);
      const out: string[] = [];
      if (/more work behind/.test(text) && !(own > peer)) out.push(`says more work, hours ${own} vs peer median ${peer}`);
      if (/fewer implied hours/.test(text) && !(own < peer)) out.push(`says fewer hours, hours ${own} vs peer median ${peer}`);
      return out;
    });
    expect(seen).toBeGreaterThan(300);
    expect(v).toEqual([]);
  });

  it("both sentences stay on one side of the peer median wherever both are printed", () => {
    const v = collect((p) => {
      const rank = hoursRankSentence(p.ctx, p.label);
      const hours = hoursSentence(p.ctx, p.label);
      if (!rank || !hours) return [];
      const own = hoursOf(tierRow(p, "moderate"))!;
      const peer = peerHours(p);
      const rankSaysMore = /more work/.test(rank);
      const rankSaysFewer = /fewer implied hours/.test(rank);
      const hoursSaysMore = /more hours? of work/.test(hours);
      const hoursSaysFewer = /fewer implied hours?/.test(hours);
      return (rankSaysMore && hoursSaysFewer) || (rankSaysFewer && hoursSaysMore) || (rankSaysFewer && own >= peer) || (rankSaysMore && own <= peer)
        ? [`rank: ${rank} | hours: ${hours}`]
        : [];
    });
    expect(v).toEqual([]);
  });
});
