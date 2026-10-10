import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/constants/categories";
import { STATES } from "@/lib/constants/states";
import {
  assumptionItems,
  calculationBlocks,
  clusterSentence,
  consistencySentence,
  datasetSentences,
  movementSentences,
  rateGroupSentences,
  trajectorySentence,
} from "@/lib/seo/state-context";
import { buildStateFaq } from "@/lib/seo/state-faq";
import {
  NAME_RE,
  collect,
  middle,
  money,
  nameToCode,
  seedRow,
  seedTable,
  strictRank,
  tierRow,
  usd,
  type Page,
  type Tier,
} from "./helpers/k4a-oracle";

/*
 * Adversarial review round 1 (r1-truth-*): sentences whose claim the page's own numbers contradict.
 * Each check recomputes the relation from the seed rows and holds on every page that prints the sentence.
 */

const ownMedian = (p: Page, tier: Tier = "moderate") => tierRow(p, tier)?.median;
const NUMBER_WORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5 };
const namesIn = (text: string) => [...text.matchAll(new RegExp(NAME_RE, "g"))].map((m) => m[1]!);

function descending(p: Page) {
  const table = seedTable(p.category, "moderate");
  const sorted = [...table].sort((a, b) => b.median - a.median);
  return { table, sorted, position: sorted.findIndex((r) => r.code === p.code) + 1 };
}

describe("r1-truth-TXT-01: 'as many as N places' counts one direction", () => {
  it("N is the larger of the states within three percent above and below, ties counting on both sides", () => {
    const v = collect((p) => {
      const item = assumptionItems(p.ctx, p.label).find((i) => /past as many as \d+ places/.test(i));
      if (!item) return [];
      const stated = Number(item.match(/past as many as (\d+) places/)![1]);
      const own = ownMedian(p)!;
      const peers = seedTable(p.category, "moderate").filter(
        (r) => r.code !== p.code && Math.abs(r.median - own) / own <= 0.03,
      );
      const reach = Math.max(peers.filter((r) => r.median >= own).length, peers.filter((r) => r.median <= own).length);
      return stated === reach ? [] : [`says ${stated}, one direction reaches ${reach}`];
    });
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-02: a state with nobody within three percent does not 'move several places'", () => {
  it("clusterSentence says the rank holds when no state is within three percent", () => {
    let seen = 0;
    const v = collect((p) => {
      const own = ownMedian(p)!;
      const near = seedTable(p.category, "moderate").filter((r) => r.code !== p.code && Math.abs(r.median - own) / own <= 0.03);
      if (near.length > 0) return [];
      seen++;
      const text = clusterSentence(p.ctx, p.label) ?? "";
      const out: string[] = [];
      if (/several places/.test(text)) out.push(`cluster sentence moves the state several places: ${text}`);
      if (!/rank would hold/.test(text)) out.push(`cluster sentence does not say the rank would hold: ${text}`);
      return out;
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-03: 'not the middle of the band' only when the gaps differ", () => {
  it("the dataset sentence matches the two gaps it prints", () => {
    const v = collect((p) => {
      const text = datasetSentences(p.ctx).join(" ");
      const m = text.match(/(\$[\d,]+) above the (\$[\d,]+) floor, (\$[\d,]+) under the (\$[\d,]+) ceiling/);
      if (!m) return ["gap clause missing"];
      const equal = money(m[1]!) === money(m[3]!);
      const saysNotMiddle = /not the middle of the band/.test(text);
      const saysMiddle = /(?:also|and) the middle of the band/.test(text);
      if (equal && saysNotMiddle) return [`${m[0]} is called not the middle`];
      if (equal && !saysMiddle) return [`${m[0]} is not called the middle`];
      if (!equal && !saysNotMiddle) return [`${m[0]} is not called off-centre`];
      return [];
    });
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-04: the number of places matches the states named", () => {
  it("'Climbing N places' and 'N places down' name exactly N states", () => {
    let checked = 0;
    const v = collect((p) => {
      const { sorted, position } = descending(p);
      const text = movementSentences(p.ctx, p.label).join(" ");
      const out: string[] = [];
      const up = text.match(/Climbing (\w+) places? would mean passing (.+?)(?: and adding |, which (?:all record|records))/);
      const upExpected = Math.min(5, position - 1);
      if (upExpected > 0) {
        checked++;
        if (!up) out.push("climbing sentence missing");
        else if (NUMBER_WORDS[up[1]!] !== upExpected || namesIn(up[2]!).length !== upExpected) {
          out.push(`climbing ${up[1]} places names ${namesIn(up[2]!).length}, expected ${upExpected}`);
        }
      }
      const down = text.match(/(\w+) places? down means passing under (.+?)(?:, which (?:all record|records)|:)/i);
      const downExpected = Math.min(5, sorted.length - position);
      if (downExpected > 0) {
        checked++;
        if (!down) out.push("down sentence missing");
        else if (NUMBER_WORDS[down[1]!.toLowerCase()] !== downExpected || namesIn(down[2]!).length !== downExpected) {
          out.push(`${down[1]} places down names ${namesIn(down[2]!).length}, expected ${downExpected}`);
        }
      }
      return out;
    });
    expect(checked).toBeGreaterThan(500);
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-05: the rate-group sentences claim only what the totals and neighbours show", () => {
  it("'totals do' is printed only for states whose total differs", () => {
    let seen = 0;
    const v = collect((p) => {
      const sentence = rateGroupSentences(p.ctx, p.label).find((s) => /rate cannot separate them, totals do/.test(s));
      if (!sentence) return [];
      seen++;
      const names = sentence.match(/^(.+?) records? the same /)![1]!.split(", ");
      const own = ownMedian(p)!;
      return names.flatMap((name) =>
        seedRow(p.category, "moderate", nameToCode.get(name)!)!.median === own ? [`${name} has the same total ${usd(own)}`] : [],
      );
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("a same-rate state with an identical total is reported as having it", () => {
    let seen = 0;
    const v = collect((p) => {
      const own = ownMedian(p)!;
      const sentence = rateGroupSentences(p.ctx, p.label).find((s) => /^.+? records? the same \$[\d,]+:/.test(s));
      if (!sentence) return [];
      const names = sentence.match(/^(.+?) records? the same /)![1]!.split(", ");
      const identical = names.filter((name) => seedRow(p.category, "moderate", nameToCode.get(name)!)!.median === own);
      if (identical.length === 0) return [];
      seen++;
      return sentence.includes(usd(own)) ? [] : [`identical total ${usd(own)} not stated: ${sentence}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("'not the cost pairing' is printed only when the rate neighbours differ from the cost neighbours", () => {
    let seen = 0;
    const v = collect((p) => {
      const sentence = rateGroupSentences(p.ctx, p.label).find((s) => /cost pairing/.test(s));
      if (!sentence) return [];
      seen++;
      const m = sentence.match(/between (.+?) \(\$[\d,]+\) and (.+?) \(\$[\d,]+\) — not the .+? cost pairing/);
      if (!m) return [];
      const { sorted, position } = descending(p);
      const nameOf = (code?: string) => STATES.find((s) => s.code === code)?.name;
      const cost = [nameOf(sorted[position - 2]?.code), nameOf(sorted[position]?.code)].sort().join("|");
      return [m[1], m[2]].sort().join("|") === cost ? [`rate neighbours ${m[1]} and ${m[2]} are the cost neighbours`] : [];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("the same pair is named as the cost pair when it is", () => {
    const v = collect((p) => {
      const sentence = rateGroupSentences(p.ctx, p.label).find((s) => /an hour puts .+ between /.test(s));
      if (!sentence) return [];
      const m = sentence.match(/between (.+?) \(\$[\d,]+\) and (.+?) \(\$[\d,]+\)/)!;
      const { sorted, position } = descending(p);
      const nameOf = (code?: string) => STATES.find((s) => s.code === code)?.name;
      const same = [m[1], m[2]].sort().join("|") === [nameOf(sorted[position - 2]?.code), nameOf(sorted[position]?.code)].sort().join("|");
      return same === !/cost pairing/.test(sentence) ? [] : [`pairing claim wrong: ${sentence}`];
    });
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-06: a state ranked in one third of every table is not called non-uniform", () => {
  const standings = (p: Page) =>
    CATEGORIES.flatMap((c) => {
      const table = seedTable(c.slug, "moderate");
      const own = table.find((r) => r.code === p.code);
      if (!own) return [];
      const higher = table.filter((r) => r.median > own.median).length;
      const lower = table.filter((r) => r.median < own.median).length;
      return [{ rank: higher + 1, of: table.length, higher, lower }];
    });

  it("no 'does not rank uniformly' when every table puts the state in the same third", () => {
    let seen = 0;
    const v = collect((p) => {
      const s = standings(p);
      const allTop = s.every((r) => r.higher * 3 < r.of);
      const allBottom = s.every((r) => r.higher * 3 >= r.of && r.lower * 3 < r.of);
      if (!allTop && !allBottom) return [];
      seen++;
      const text = consistencySentence(p.ctx, p.label) ?? "";
      return /does not rank uniformly|-place spread/.test(text) ? [text] : [];
    });
    expect(seen).toBeGreaterThan(100);
    expect(v).toEqual([]);
  });

  it("the extremes are the lowest and highest position inside their own tables, and the spread is a share of the table", () => {
    const v = collect((p) => {
      const text = consistencySentence(p.ctx, p.label);
      if (!text) return [];
      const s = standings(p);
      const fractions = s.map((r) => r.rank / r.of);
      const stated = [...text.matchAll(/(\d+)(?:st|nd|rd|th) of (\d+)/g)].map((m) => Number(m[1]) / Number(m[2]));
      const out: string[] = [];
      if (/-place spread/.test(text)) out.push("rank numbers from tables of different sizes are subtracted");
      if (Math.abs(stated[0]! - Math.min(...fractions)) > 1e-9 || Math.abs(stated[1]! - Math.max(...fractions)) > 1e-9) {
        out.push(`extremes ${stated.join("/")} but relative extremes are ${Math.min(...fractions)}/${Math.max(...fractions)}`);
      }
      const share = text.match(/(\d+) percent of the table/);
      if (share && Number(share[1]) !== Math.round((Math.max(...fractions) - Math.min(...fractions)) * 100)) {
        out.push(`${share[0]} but relative spread is ${Math.round((Math.max(...fractions) - Math.min(...fractions)) * 100)}`);
      }
      return out;
    });
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-07/08/09: tier-trajectory claims agree with the tier tables", () => {
  const simpleMid = (p: Page) => middle(seedTable(p.category, "simple").map((r) => r.median));
  const tierRanks = (p: Page) =>
    (["simple", "moderate", "complex"] as const).map((tier) => {
      const table = seedTable(p.category, tier);
      return strictRank(table, table.find((r) => r.code === p.code)!.median);
    });
  const complexityAnswer = (p: Page) =>
    buildStateFaq(p.ctx, p.label).find((e) => /vary by complexity/.test(e.question))?.answer ?? "";

  it("FAQ: a premium concentrated in straightforward matters needs a simple-tier median above the tier midpoint", () => {
    let seen = 0;
    const v = collect((p) => {
      if (!/premium .+ carries is concentrated in straightforward matters/.test(complexityAnswer(p))) return [];
      seen++;
      return ownMedian(p, "simple")! > simpleMid(p) ? [] : [`simple ${usd(ownMedian(p, "simple")!)} <= midpoint ${usd(simpleMid(p))}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("trajectory: 'expensive to start' needs a simple-tier median above the tier midpoint", () => {
    let seen = 0;
    const v = collect((p) => {
      if (!/expensive to start/.test(trajectorySentence(p.ctx, p.label) ?? "")) return [];
      seen++;
      return ownMedian(p, "simple")! > simpleMid(p) ? [] : [`simple ${usd(ownMedian(p, "simple")!)} <= midpoint ${usd(simpleMid(p))}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });

  it("'barely moves' and 'similar position at every tier' need the three tier ranks within three places", () => {
    let seen = 0;
    const v = collect((p) => {
      const claims = /barely moves/.test(trajectorySentence(p.ctx, p.label) ?? "") || /similar position at every tier/.test(complexityAnswer(p));
      if (!claims) return [];
      seen++;
      const ranks = tierRanks(p);
      return Math.max(...ranks) - Math.min(...ranks) <= 3 ? [] : [`tier ranks ${ranks.join("/")}`];
    });
    expect(seen).toBeGreaterThan(0);
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-10: the simple-tier step sentence states each hour count with its own rate", () => {
  it("no '(N) more, at the moderate tier's own rate', and the hours at their rates add up to the dollar step", () => {
    let seen = 0;
    const v = collect((p) => {
      const body = calculationBlocks(p.ctx, p.label).find((b) => b.lead === "Simple tier.")?.body ?? "";
      if (!/step to the moderate tier/.test(body)) return [];
      seen++;
      const m = body.match(/The (\$[\d,]+) step to the moderate tier takes the implied hours from (\d+) at (\$[\d,]+) to (\d+) at (\$[\d,]+)\./);
      if (/\d+ more, at the moderate tier's own/.test(body)) return ["step paired with an hour gap and the moderate rate"];
      if (!m) return [`step sentence has an unexpected form: ${body}`];
      const [step, h1, r1, h2, r2] = [money(m[1]!), Number(m[2]), money(m[3]!), Number(m[4]), money(m[5]!)];
      return Math.abs(h2 * r2 - h1 * r1 - step) <= (r1 + r2) / 2 + 1 ? [] : [`${h2}x${r2} - ${h1}x${r1} != ${step}`];
    });
    expect(seen).toBeGreaterThan(200);
    expect(v).toEqual([]);
  });
});

describe("r1-truth-TXT-13: the pro se divorce answer does not reduce the cost to two items", () => {
  const answer = CATEGORIES.find((c) => c.slug === "divorce")!.faqTemplates!.find((f) => /pro se/.test(f.questionTemplate))!.answerTemplate;

  it("says the attorney fee drops out and the other fees still apply", () => {
    expect(answer).not.toMatch(/reduces the cost to/);
    expect(answer).toMatch(/non-attorney charges[^.]*still apply/);
  });
});
