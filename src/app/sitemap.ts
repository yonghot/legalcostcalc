import type { MetadataRoute } from "next";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { INDEXED_PAGES } from "@/lib/index-policy";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { NEWEST_UPDATE_DATE } from "@/lib/site-updates";
import { allCostFamilyKeys, costFamilyKey, getFamilyDate, maxFamilyDate } from "@/lib/content-dates";

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(url: string, priority: number, date: string | undefined): SitemapEntry {
  return date ? { url, lastModified: date, priority } : { url, priority };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const familyDate = (key: string) => getFamilyDate(key)?.date;

  const staticPages: MetadataRoute.Sitemap = [
    entry(CANONICAL_ORIGIN, 1.0, familyDate("page:home")),
    entry(`${CANONICAL_ORIGIN}/compare`, 0.8, familyDate("page:compare")),
    entry(`${CANONICAL_ORIGIN}/divorce-cost-by-state`, 0.8, familyDate("page:divorce-cost-by-state")),
    entry(`${CANONICAL_ORIGIN}/legal-cost-statistics`, 0.8, familyDate("page:legal-cost-statistics")),
    entry(`${CANONICAL_ORIGIN}/how-legal-fees-work`, 0.8, familyDate("guide")),
    entry(`${CANONICAL_ORIGIN}/about`, 0.6, familyDate("page:about")),
    entry(`${CANONICAL_ORIGIN}/settlement-estimator`, 0.6, familyDate("page:settlement-estimator")),
    entry(`${CANONICAL_ORIGIN}/embed`, 0.4, familyDate("page:embed")),
    entry(`${CANONICAL_ORIGIN}/updates`, 0.3, NEWEST_UPDATE_DATE),
  ];

  const allCostDate = maxFamilyDate(allCostFamilyKeys());
  const hubPages: MetadataRoute.Sitemap = [
    ...STATES.map((state) => entry(`${CANONICAL_ORIGIN}/${state.slug}`, 0.6, allCostDate)),
    ...CATEGORIES.map((cat) =>
      entry(`${CANONICAL_ORIGIN}/category/${cat.slug}`, 0.6, familyDate(costFamilyKey(cat.slug))),
    ),
  ];

  const seoPages: MetadataRoute.Sitemap = INDEXED_PAGES.map((page) =>
    entry(`${CANONICAL_ORIGIN}${page.path}`, 0.7, familyDate(costFamilyKey(page.category.slug))),
  );

  console.log(
    `sitemap: ${staticPages.length + hubPages.length + seoPages.length} indexable URLs ` +
      `(${seoPages.length}/${STATES.length * CATEGORIES.length} programmatic pages are indexable)`,
  );

  return [...staticPages, ...hubPages, ...seoPages];
}
