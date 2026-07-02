import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { HubLinks, type HubLinkRow } from "@/components/seo/hub-links";
import { CATEGORIES, CATEGORY_MAP } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getModerateMedianCost } from "@/lib/page-index";
import { buildMeta } from "@/lib/seo";
import { FOCUS_RING } from "@/lib/utils/styles";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateStaticParams() {
  return CATEGORIES.map((category) => ({ category: category.slug }));
}

export const revalidate = 604800; // 7 days

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const categoryInfo = CATEGORY_MAP.get(categorySlug);
  if (!categoryInfo) return { title: "Not Found" };

  return buildMeta({
    title: `${categoryInfo.displayName} Cost by State`,
    description: `Compare ${categoryInfo.displayName.toLowerCase()} costs across all 50 states and DC. Free, sourced, and dated cost estimates by state.`,
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
          <Disclaimer />

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
            Compare estimated {categoryInfo.displayName.toLowerCase()} costs across all 50 states
            and the District of Columbia.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {rows.length > 0 ? (
            <HubLinks rows={rows} labelHeader="State" />
          ) : (
            <p className="text-sm text-slate-500">
              Cost data for {categoryInfo.displayName.toLowerCase()} is currently being collected.
            </p>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className={`text-sm font-medium text-teal-600 hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
            >
              ← Back to all categories
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
