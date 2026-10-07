import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { getCategoryTierFigures, hasUniqueData } from "@/lib/page-index";
import { buildStateCostContext, type StateCostContext } from "@/lib/seo/state-context";
import { formatCurrency } from "@/lib/utils/format";

export type Tier = "simple" | "moderate" | "complex";

export interface SeedRow {
  code: string;
  low: number;
  median: number;
  high: number;
  rate: number;
  duration: string | null;
}

export const usd = (n: number) => formatCurrency(Math.round(n));
export const money = (s: string) => Number(s.replace(/[$,]/g, ""));
export const MONEY = "(\\$[\\d,]+)";

export const ord = (n: number) => {
  const r = n % 100;
  if (r >= 11 && r <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10 > 3 ? 0 : n % 10]}`;
};

export const nameToCode = new Map(STATES.map((s) => [s.name, s.code]));

const toRow = (r: ReturnType<typeof getCategoryTierFigures>[number]): SeedRow => ({
  code: r.stateCode,
  low: r.low,
  median: r.median,
  high: r.high,
  rate: r.hourlyMedian ?? 0,
  duration: r.duration,
});

/** The peer table a page ranks against: every state that passes the information-gain gate. */
export function seedTable(category: string, tier: Tier): SeedRow[] {
  return getCategoryTierFigures(category, tier)
    .filter((r) => hasUniqueData(r.stateCode, category) && r.median > 0)
    .map(toRow);
}

/** One state's row at a tier, read straight from the seed accessor (no gate). */
export function seedRow(category: string, tier: Tier, code: string): SeedRow | undefined {
  const row = getCategoryTierFigures(category, tier).find((r) => r.stateCode === code);
  return row ? toRow(row) : undefined;
}

export function middle(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export const impliedHours = (row: { median: number; rate: number }): number | null =>
  row.rate > 0 ? Math.round(row.median / row.rate) : null;

/** Midpoint in months of "a-b months" or "a months"; null for weeks, years and "12+" forms. */
export function monthsOf(duration: string | null): number | null {
  if (!duration) return null;
  const range = duration.match(/^(\d+)-(\d+) months?$/);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const single = duration.match(/^(\d+) months?$/);
  return single ? Number(single[1]) : null;
}

export interface Page {
  code: string;
  state: string;
  category: string;
  label: string;
  ctx: StateCostContext;
}

export const PAGES: Page[] = STATES.flatMap((s) =>
  CATEGORIES.flatMap((c) => {
    const ctx = buildStateCostContext(s.code, c.slug);
    return ctx ? [{ code: s.code, state: s.name, category: c.slug, label: c.displayName.toLowerCase(), ctx }] : [];
  }),
);

export const pageKey = (p: Page) => `${p.state}/${p.category}`;

export function collect(check: (p: Page) => string[]): string[] {
  return PAGES.flatMap((p) => check(p).map((v) => `${pageKey(p)}: ${v}`));
}

export const tierRow = (p: Page, tier: Tier): SeedRow | undefined => seedRow(p.category, tier, p.code);

export function strictRank(table: { median: number }[], median: number): number {
  return 1 + table.filter((r) => r.median > median).length;
}

/** Every `$` amount in a sentence, as numbers, in order. */
export const amounts = (text: string): number[] => [...text.matchAll(/\$[\d,]+/g)].map((m) => money(m[0]));
