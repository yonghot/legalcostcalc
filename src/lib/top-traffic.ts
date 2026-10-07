import evidence from "@/data/k8-evidence.json";
import { isIndexable } from "@/lib/index-policy";
import { PAGE_INDEX, type PageIndexEntry } from "@/lib/page-index";

export interface TrafficPage {
  path: string;
  stateName: string;
  categoryName: string;
  categorySlug: string;
  views: number;
}

interface EvidencePath {
  path: string;
  organicViews: number;
  aiViews: number;
  referralViews: number;
}

const PAGE_BY_PATH = new Map<string, PageIndexEntry>(PAGE_INDEX.map((p) => [p.path, p]));

export function topTrafficPages(options: { categorySlug?: string; limit?: number } = {}): TrafficPage[] {
  const { categorySlug, limit = 6 } = options;
  return (evidence.paths as EvidencePath[])
    .flatMap((row) => {
      const page = PAGE_BY_PATH.get(row.path);
      if (!page || !isIndexable(page.state.code, page.category.slug)) return [];
      if (categorySlug && page.category.slug !== categorySlug) return [];
      return [
        {
          path: page.path,
          stateName: page.state.name,
          categoryName: page.category.displayName,
          categorySlug: page.category.slug,
          views: row.organicViews + row.aiViews + row.referralViews,
        },
      ];
    })
    .sort((a, b) => b.views - a.views || a.path.localeCompare(b.path))
    .slice(0, limit);
}
