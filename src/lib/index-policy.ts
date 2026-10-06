import policyData from "@/data/index-policy.json";
import { PAGE_INDEX, type PageIndexEntry } from "@/lib/page-index";

export interface IndexPolicyData {
  keep: string[] | null;
  noindex: string[];
  exceptions: string[];
}

type PolicyPage = Pick<PageIndexEntry, "path" | "hasUniqueData"> & {
  state: { code: string };
  category: { slug: string };
};

export interface IndexPolicy<T extends PolicyPage = PolicyPage> {
  isIndexable(stateCode: string, categorySlug: string): boolean;
  indexedPages: T[];
}

function assertKnownPaths(label: string, paths: readonly string[], known: ReadonlySet<string>): void {
  for (const path of paths) {
    if (!known.has(path)) throw new Error(`index-policy: ${label} lists "${path}", which is not a page`);
  }
}

export function createIndexPolicy<T extends PolicyPage>(
  data: IndexPolicyData,
  pages: readonly T[],
): IndexPolicy<T> {
  const known = new Set(pages.map((p) => p.path));
  assertKnownPaths("keep", data.keep ?? [], known);
  assertKnownPaths("noindex", data.noindex, known);
  assertKnownPaths("exceptions", data.exceptions, known);

  const keep = data.keep === null ? null : new Set([...data.keep, ...data.exceptions]);
  const noindex = new Set(data.noindex);

  const indexable = (page: T): boolean =>
    page.hasUniqueData && !noindex.has(page.path) && (keep === null || keep.has(page.path));

  const indexedPages = pages.filter(indexable);
  const byKey = new Map(pages.map((p) => [`${p.state.code}:${p.category.slug}`, p]));

  return {
    indexedPages,
    isIndexable: (stateCode, categorySlug) => {
      const page = byKey.get(`${stateCode}:${categorySlug}`);
      return page !== undefined && indexable(page);
    },
  };
}

const policy = createIndexPolicy(policyData as IndexPolicyData, PAGE_INDEX);

export const isIndexable = policy.isIndexable;
export const INDEXED_PAGES: PageIndexEntry[] = policy.indexedPages;
