import { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { STATES } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { INDEXABLE_PAGES } from "@/lib/page-index";
import { buildMeta } from "@/lib/seo";
import { FOCUS_RING } from "@/lib/utils/styles";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMeta({
    title: q ? `Search results for "${q}"` : "Search Legal Cost Pages",
    description:
      "Search LegalCostCalc for legal cost pages by state or matter type (divorce, DUI, bankruptcy, and more).",
    path: "/search",
    skipFit: true,
    robots: { index: false, follow: true },
  });
}

interface SearchResult {
  key: string;
  label: string;
  href: string;
}

/**
 * CODE-02 — the real target for the root WebSite's `potentialAction:
 * SearchAction` (Sitelinks Searchbox). Matches the query against real state
 * names and category display names and links directly to the corresponding
 * indexable cost page — no fabricated data, no dead-end target. Kept
 * noindex,follow since it is a utility/results page, not unique content
 * (mirrors the thin-page gate posture used elsewhere in this repo).
 */
function search(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const results: SearchResult[] = [];

  // Match "<category> cost in <state>"-style and bare state/category queries
  // against the real indexable page set only (never links to a noindexed,
  // thin page).
  for (const entry of INDEXABLE_PAGES) {
    const stateMatch = entry.state.name.toLowerCase().includes(q);
    const categoryMatch = entry.category.displayName.toLowerCase().includes(q);
    if (stateMatch || categoryMatch) {
      results.push({
        key: `${entry.state.code}-${entry.category.slug}`,
        label: `${entry.category.displayName} Cost in ${entry.state.name}`,
        href: entry.path,
      });
    }
    if (results.length >= 25) break;
  }

  return results;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "" } = await searchParams;
  const results = search(q);

  return (
    <div>
      <BreadcrumbSchema items={[{ name: "Home", href: "/" }, { name: "Search", href: "/search" }]} />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
          <Breadcrumbs
            className="mt-8 mb-4"
            items={[{ name: "Home", href: "/" }, { name: "Search", href: "/search" }]}
          />
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {q ? `Search results for "${q}"` : "Search Legal Cost Pages"}
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Find cost pages by state (e.g. &ldquo;California&rdquo;) or legal matter (e.g.
            &ldquo;Divorce&rdquo;).
          </p>

          <form action="/search" method="get" className="mt-6 flex max-w-md gap-2">
            <label htmlFor="search-q" className="sr-only">
              Search
            </label>
            <input
              id="search-q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="e.g. Divorce cost in Texas"
              className={`w-full rounded-md border border-slate-300 px-3 py-2 text-sm ${FOCUS_RING}`}
            />
            <button
              type="submit"
              className={`rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 ${FOCUS_RING}`}
            >
              Search
            </button>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {q && results.length === 0 && (
            <p className="text-sm text-slate-500">
              No matching cost pages found. Try a state name or one of our{" "}
              {CATEGORIES.length} legal categories.
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
              {results.map((r) => (
                <li key={r.key}>
                  <Link
                    href={r.href}
                    className={`block px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50 hover:text-teal-700 ${FOCUS_RING}`}
                  >
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {!q && (
            <div className="text-sm text-slate-500">
              <p>Browse all {STATES.length} states or {CATEGORIES.length} legal matter types:</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/category/${c.slug}`}
                    className={`rounded-full border border-slate-200 px-3 py-1 hover:border-teal-200 hover:text-teal-700 ${FOCUS_RING}`}
                  >
                    {c.displayName}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
