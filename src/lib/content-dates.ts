import contentDates from "@/data/content-dates.json";

export type DateBasis = "sources-rechecked" | "content-changed";

export interface FamilyDate {
  date: string;
  basis: DateBasis;
  evidence: string;
}

const FAMILIES: Readonly<Record<string, FamilyDate>> = contentDates as Record<string, FamilyDate>;

export function getFamilyDate(key: string): FamilyDate | undefined {
  return FAMILIES[key];
}

export function costFamilyKey(categorySlug: string): string {
  return `cost:${categorySlug}`;
}

export function latestFamily(keys: readonly string[]): FamilyDate | undefined {
  const records = keys.map((k) => FAMILIES[k]).filter((r): r is FamilyDate => Boolean(r));
  return records.length > 0 ? records.reduce((a, b) => (a.date >= b.date ? a : b)) : undefined;
}

export function maxFamilyDate(keys: readonly string[]): string | undefined {
  return latestFamily(keys)?.date;
}

export function allCostFamilyKeys(): string[] {
  return Object.keys(FAMILIES).filter((k) => k.startsWith("cost:"));
}

export function familyYear(key: string): number | undefined {
  const date = FAMILIES[key]?.date;
  return date ? Number(date.slice(0, 4)) : undefined;
}

export function latestContentYear(): number {
  const latest = maxFamilyDate(Object.keys(FAMILIES));
  if (!latest) throw new Error("content-dates: no family dates recorded");
  return Number(latest.slice(0, 4));
}

export function formatDate(isoDate: string, style: "month" | "day" = "month"): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    ...(style === "day" ? { day: "numeric" } : {}),
  });
}

export function dateLabel(record: FamilyDate, style: "month" | "day" = "month"): string {
  const when = formatDate(record.date, style);
  return record.basis === "sources-rechecked" ? `Sources checked ${when}` : `Updated ${when}`;
}

export function isOlderThanOneYear(isoDate: string, now: Date = new Date()): boolean {
  const limit = new Date(now);
  limit.setUTCFullYear(limit.getUTCFullYear() - 1);
  return new Date(`${isoDate}T00:00:00Z`) < limit;
}
