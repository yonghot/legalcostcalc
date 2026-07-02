import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Disclaimer } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { HubLinks, type HubLinkRow } from "@/components/seo/hub-links";
import { STATES, STATE_BY_SLUG } from "@/lib/constants/states";
import { CATEGORIES } from "@/lib/constants/categories";
import { INDEXABLE_PAGES, getModerateMedianCost } from "@/lib/page-index";
import { buildMeta } from "@/lib/seo";
import { FOCUS_RING } from "@/lib/utils/styles";
import Link from "next/link";

interface PageProps {
  params: Promise<{ state: string }>;
}

export async function generateStaticParams() {
  return STATES.map((state) => ({ state: state.slug }));
}

export const revalidate = 604800; // 7 days

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  if (!stateInfo) return { title: "Not Found" };

  return buildMeta({
    title: `Legal Costs in ${stateInfo.name}`,
    description: `Compare legal costs across 8 matter types in ${stateInfo.name}, including divorce, DUI, bankruptcy, and more. Free cost estimates, sourced and dated.`,
    path: `/${stateInfo.slug}`,
  });
}

export default async function StateHubPage({ params }: PageProps) {
  const { state: stateSlug } = await params;
  const stateInfo = STATE_BY_SLUG.get(stateSlug);
  if (!stateInfo) notFound();

  // T09: hub lists ONLY pages that exist and pass hasUniqueData — draws from
  // the same INDEXABLE_PAGES set that gates the sitemap and generateMetadata
  // robots directive, so this hub never links to a noindexed page.
  const rows: HubLinkRow[] = INDEXABLE_PAGES.filter((p) => p.state.code === stateInfo.code)
    .sort((a, b) => a.category.sortOrder - b.category.sortOrder)
    .map((p) => ({
      key: p.category.slug,
      label: `${p.category.displayName} Cost`,
      href: p.path,
      medianCost: getModerateMedianCost(stateInfo.code, p.category.slug),
    }));

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: stateInfo.name, href: `/${stateInfo.slug}` },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: stateInfo.name, href: `/${stateInfo.slug}` },
            ]}
          />

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Legal Costs in {stateInfo.name}
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Compare estimated legal costs for {CATEGORIES.length} common matter types in{" "}
            {stateInfo.name}, including attorney fees, court costs, and typical case duration.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {rows.length > 0 ? (
            <HubLinks rows={rows} labelHeader="Legal Matter" />
          ) : (
            <p className="text-sm text-slate-500">
              Cost data for {stateInfo.name} is currently being collected.
            </p>
          )}

          <div className="mt-8">
            <Link
              href="/"
              className={`text-sm font-medium text-teal-600 hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
            >
              ← Back to all states
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
