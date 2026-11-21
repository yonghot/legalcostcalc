export interface SiteUpdate {
  id: string;
  date: string;
  title: string;
  body: string;
  commits: readonly string[];
  files: ReadonlyArray<{ path: string; marker: string }>;
}

export const SITE_UPDATES: readonly SiteUpdate[] = [
  {
    id: "generated-statements-corrected",
    date: "2026-11-22",
    title: "Generated sentences that contradicted a page's own figures were corrected or deleted",
    body:
      "Several sentences on the state and matter pages, the hubs, the home page, the About page, the footer and the fees guide were produced by templates. Where a sentence made a ranking, comparison, count or cause claim that the figures printed on the same page did not support, it now states only what the table shows, or it was deleted.",
    commits: ["1c7218e", "4d8fe23", "6357758", "886034c", "0ddd2af"],
    files: [],
  },
  {
    id: "unsupported-claims-removed",
    date: "2026-11-22",
    title: "Claims the data could not back were removed, and the figures are described as modeled estimates",
    body:
      "Wording that described the figures as recorded, verified or kept on a fixed refresh schedule was removed. Durations are described as a national assumption, and the common fee lines are labeled as nationwide ranges rather than state figures.",
    commits: ["0bbc73e", "0389b77", "e638b87", "a0cd4c7"],
    files: [],
  },
  {
    id: "california-divorce-filing-fee",
    date: "2026-11-22",
    title: "California divorce court filing fee now shown with its source; other states no longer print a national range",
    body:
      "The California divorce court filing fee is shown as $435-$450, with the source (the California Courts self-help guide) and the date it was checked. The other states' court filing fee line no longer prints a dollar range and says the court sets the fee and it varies by county. Percentages derived from the old range were removed.",
    commits: ["ddff296"],
    files: [{ path: "src/data/verified-fees.json", marker: "selfhelp.courts.ca.gov" }],
  },
  {
    id: "consent-controls",
    date: "2026-11-22",
    title: "Consent controls changed",
    body:
      "The consent default for ads and analytics is now set in the page HTML by region before the ad script. Outside the EEA, the UK and Switzerland no consent banner opens automatically; in those regions the choice is handled by Google's consent dialog, and Decline withdraws consent. If Manage consent cannot open Google's dialog, a decline-only notice opens instead.",
    commits: ["d7cad0a", "ae95dd9", "5a767b6", "140a992", "66aaa4c"],
    files: [],
  },
  {
    id: "forms-and-policy-pages",
    date: "2026-11-22",
    title: "Forms, policy pages and links to unrelated sites brought in line with what the site does",
    body:
      "The contact and feedback forms no longer report success when nothing was delivered. The Privacy page was rewritten to match the analytics, ads, forms and cookies in use. A Terms section with placeholder text was removed, and a block of links to unrelated sites was removed.",
    commits: ["16324d6", "df71c0a", "8aad6d9", "89c635a"],
    files: [],
  },
  {
    id: "page-dates-follow-changes",
    date: "2026-11-22",
    title: "Page dates now follow the day a page's content changed",
    body:
      "The dates shown on pages, the dates in the sitemap and the dates in structured data now come from a record, kept for each group of pages, of when the content last changed, instead of one sitewide date.",
    commits: ["49a17d9", "bf4f96e", "6a61260"],
    files: [{ path: "src/data/content-dates.json", marker: '"basis": "content-changed"' }],
  },
];

export const NEWEST_UPDATE_DATE: string = SITE_UPDATES[0]!.date;
