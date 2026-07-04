import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";

/**
 * CODE-05 — shared "as of {date}" label for OG images, sourced from the SAME
 * real, sitewide-verified date already used by UpdatedBadge/AuthorByline/
 * sitemap.ts (DEFAULT_FIGURES_LAST_VERIFIED / DATA_VERSION_DATE) — never
 * `new Date()` (which would stamp a fabricated freshness signal that
 * changes on every deploy/render regardless of whether the underlying data
 * changed).
 */
export function getOgAsOfLabel(): string {
  const iso = DEFAULT_FIGURES_LAST_VERIFIED;
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const formatted = date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `As of ${formatted}`;
}
