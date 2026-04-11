/**
 * Data version date — bumped manually when cost data is verified/refreshed.
 *
 * Used by sitemap `lastModified` so search engines only see a changed date
 * when the underlying data has actually been updated. Using `new Date()`
 * triggered recrawls on every deploy regardless of whether content changed.
 */
export const DATA_VERSION_DATE = new Date("2026-04-11T00:00:00Z");
