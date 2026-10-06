import { dateLabel, latestFamily } from "@/lib/content-dates";

/**
 * Freshness label for OG images, taken from the page family's content-dates
 * records (the latest of the given keys), never `new Date()`.
 */
export function getOgAsOfLabel(keys: readonly string[]): string {
  const record = latestFamily(keys);
  return record ? dateLabel(record) : "";
}
