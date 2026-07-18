import type { MetadataRoute } from "next";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { GUIDE_UPDATED } from "@/app/how-legal-fees-work/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = DATA_VERSION_DATE;
  // U-03 (부속U §4): the guide's own real content-verification date, NOT the
  // cost-dataset's DATA_VERSION_DATE — /how-legal-fees-work is independent
  // editorial content (verified 2026-07-18, see content.ts), unrelated to
  // when costs.json was last refreshed. Using the shared dataset date here
  // would report a stale lastmod for a page that was actually authored/
  // verified more recently.
  const guideLastModified = new Date(`${GUIDE_UPDATED}T00:00:00Z`);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: CANONICAL_ORIGIN,
      lastModified,
      changeFrequency: "monthly",
      priority: 1.0,
    },
    {
      url: `${CANONICAL_ORIGIN}/compare`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // K07 — divorce-cost-by-state hub (July seasonal build queue priority #2).
      url: `${CANONICAL_ORIGIN}/divorce-cost-by-state`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      // CODE-04 — statistics/data "linkable asset" page.
      url: `${CANONICAL_ORIGIN}/legal-cost-statistics`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      // U-02 (부속U §4/§5) — original editorial guide, AdSense low-value-
      // content response. lastModified = the guide's own GUIDE_UPDATED (see
      // U-03 comment on `guideLastModified` above), not the shared dataset
      // date.
      url: `${CANONICAL_ORIGIN}/how-legal-fees-work`,
      lastModified: guideLastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${CANONICAL_ORIGIN}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${CANONICAL_ORIGIN}/embed`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Hub index pages — core navigation, always indexable (state/category
  // hubs derive their listed links from INDEXABLE_PAGES themselves).
  const hubPages: MetadataRoute.Sitemap = [
    ...STATES.map((state) => ({
      url: `${CANONICAL_ORIGIN}/${state.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...CATEGORIES.map((cat) => ({
      url: `${CANONICAL_ORIGIN}/category/${cat.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  // T09: only pages that pass the hasUniqueData gate are emitted — see
  // src/lib/page-index.ts. generateMetadata's robots directive and the
  // T06/T07 link modules read from the same INDEXABLE_PAGES set.
  const seoPages: MetadataRoute.Sitemap = INDEXABLE_PAGES.map((entry) => ({
    url: `${CANONICAL_ORIGIN}${entry.path}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  console.log(
    `sitemap: ${staticPages.length + hubPages.length + seoPages.length} indexable URLs ` +
      `(${seoPages.length}/${STATES.length * CATEGORIES.length} programmatic pages pass hasUniqueData)`,
  );

  return [...staticPages, ...hubPages, ...seoPages];
}
