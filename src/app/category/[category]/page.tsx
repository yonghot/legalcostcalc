import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Disclaimer, DisclaimerNote } from "@/components/shared/disclaimer";
import { MethodNote } from "@/components/seo/method-note";
import { lowerKeepAcronyms } from "@/lib/utils/format";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { HubLinks, type HubLinkRow } from "@/components/seo/hub-links";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getModerateMedianCost } from "@/lib/page-index";
import { STATES } from "@/lib/constants/states";
import { buildMeta } from "@/lib/seo";
import { FOCUS_RING } from "@/lib/utils/styles";
import { PopularPages } from "@/components/seo/popular-pages";
import { GuideAndCompareLine } from "@/components/seo/guide-and-compare-line";
import { topTrafficPages } from "@/lib/top-traffic";

interface PageProps {
  params: Promise<{ category: string }>;
}

function listedStateCount(categorySlug: string): number {
  return INDEXABLE_PAGES.filter((p) => p.category.slug === categorySlug).length;
}

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export const revalidate = 604800; // 7 days
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categoryInfo = CATEGORY_MAP.get(categorySlug);
  if (!categoryInfo) return { title: "Not Found", robots: { index: false, follow: false } };

  return buildMeta({
    title: `${categoryInfo.displayName} Cost by State`,
    description: `Compare ${lowerKeepAcronyms(categoryInfo.displayName)} costs across ${
      listedStateCount(categoryInfo.slug) === STATES.length ? "all 50 states and DC" : `${listedStateCount(categoryInfo.slug)} states`
    }. Free, sourced, and dated cost estimates by state.`,
    path: `/category/${categoryInfo.slug}`,
  });
}

export default async function CategoryHubPage({ params }: PageProps) {
  const { category: categorySlug } = await params;
  const categoryInfo = CATEGORY_MAP.get(categorySlug);
  if (!categoryInfo) notFound();

  // T09: hub lists ONLY pages that exist and pass hasUniqueData.
  const rows: HubLinkRow[] = INDEXABLE_PAGES.filter((p) => p.category.slug === categoryInfo.slug)
    .sort((a, b) => a.state.name.localeCompare(b.state.name))
    .map((p) => ({
      key: p.state.code,
      label: p.state.name,
      href: p.path,
      medianCost: getModerateMedianCost(p.state.code, categoryInfo.slug),
    }));

  const popular = topTrafficPages({ categorySlug: categoryInfo.slug, limit: 3 });

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: `${categoryInfo.displayName} Cost`, href: `/category/${categoryInfo.slug}` },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <DisclaimerNote />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: `${categoryInfo.displayName} Cost`, href: `/category/${categoryInfo.slug}` },
            ]}
          />

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {categoryInfo.displayName} Cost by State
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Compare estimated {lowerKeepAcronyms(categoryInfo.displayName)} costs across{" "}
            {rows.length === STATES.length ? "all 50 states and the District of Columbia" : `${rows.length} states`}.
          </p>
          <MethodNote scope="each state" />
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <PopularPages
            className="mb-10"
            heading={`Popular ${categoryInfo.displayName} cost pages`}
            intro={`${categoryInfo.displayName} cost estimates ranked by page views.`}
            pages={popular}
          />
          {rows.length > 0 ? (
            <HubLinks rows={rows} labelHeader="State" />
          ) : (
            <p className="text-sm text-slate-500">
              Cost data for {lowerKeepAcronyms(categoryInfo.displayName)} is currently being collected.
            </p>
          )}

          <GuideAndCompareLine className="mt-6" />

          <div className="mt-8">
            <Link
              href="/"
              className={`py-3 text-sm font-medium text-teal-700 hover:text-teal-800 ${FOCUS_RING} rounded-sm`}
            >
              ← Calculate your own estimate
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer id="disclaimer" />
        </div>
      </section>
    </div>
  );
}
