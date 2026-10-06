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

export function maxFamilyDate(keys: readonly string[]): string | undefined {
  const dates = keys.map((k) => FAMILIES[k]?.date).filter((d): d is string => Boolean(d));
  return dates.length > 0 ? dates.reduce((a, b) => (a >= b ? a : b)) : undefined;
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
