import { Metadata } from "next";
import { Disclaimer } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { AuthorByline } from "@/components/shared/author-byline";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { StatisticsTable } from "@/components/seo/statistics-table";
import { DatasetSchema } from "@/components/seo/dataset-schema";
import { buildStatisticsAggregate } from "@/lib/seo/statistics";
import { buildMeta, CANONICAL_ORIGIN } from "@/lib/seo";
import { DATA_VERSION_DATE } from "@/lib/constants/data-meta";
import { formatCurrency } from "@/lib/utils/format";

export const revalidate = 604800; // 7 days

const PAGE_PATH = "/legal-cost-statistics";
const DATA_VERIFIED_ISO = DATA_VERSION_DATE.toISOString().slice(0, 10);

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    // Tool/data-intent title, not a pure "what is" informational phrasing —
    // the page IS the citable statistics asset.
    title: "Legal Cost Statistics by State",
    description:
      "National averages, highest- and lowest-cost states, and cross-state legal cost comparisons across 8 matter types — free, sourced data with downloadable JSON/CSV feeds.",
    path: PAGE_PATH,
  });
}

export default function LegalCostStatisticsPage() {
  const aggregate = buildStatisticsAggregate();
  const { headline, categoryRows, findings, totalDataPoints } = aggregate;
  const canonicalUrl = `${CANONICAL_ORIGIN}${PAGE_PATH}`;

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Legal Cost Statistics", href: PAGE_PATH },
        ]}
      />

      {/* CODE-04 — Dataset JSON-LD (schema.org/Dataset is still fully
          supported for SERP/AI indexing in 2026, unlike FAQPage/HowTo —
          see CODE-02). Points at the same real aggregation rendered below
          and the downloadable data.json/data.csv feeds. */}
      <DatasetSchema
        name="LegalCostCalc Legal Cost Statistics"
        description="Aggregated median legal costs, highest- and lowest-cost states, and cross-state comparisons across 8 legal matter types in the United States."
        url={canonicalUrl}
        dateModified={DATA_VERIFIED_ISO}
        distributionUrls={[
          { url: `${canonicalUrl}/data.json`, encodingFormat: "application/json" },
          { url: `${canonicalUrl}/data.csv`, encodingFormat: "text/csv" },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: "Legal Cost Statistics", href: PAGE_PATH },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <UpdatedBadge lastVerified={DATA_VERIFIED_ISO} />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Legal Cost Statistics by State
          </h1>

          {/* Headline stat — the single most citable number on the page. */}
          {headline && (
            <p className="mt-4 text-lg text-slate-700">
              <span className="font-mono font-semibold text-teal-700">
                {formatCurrency(headline.nationalAverage)}
              </span>{" "}
              — the national median cost of a {headline.categoryDisplayName.toLowerCase()}, the most
              expensive of the {categoryRows.length} legal matter types tracked, based on{" "}
              {totalDataPoints} real state-level data points.
            </p>
          )}

          <AuthorByline lastUpdated={DATA_VERIFIED_ISO} className="mt-6" />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Key Findings</h2>
          <ul className="space-y-3">
            {findings.map((finding) => (
              <li
                key={finding}
                className="rounded-lg border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700"
              >
                {finding}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Median Cost by Matter Type</h2>
          <StatisticsTable rows={categoryRows} />
          <p className="mt-3 text-xs text-slate-400">
            National averages and state comparisons are computed from LegalCostCalc&apos;s sourced
            moderate-complexity cost dataset (see each matter type&apos;s individual state pages for full
            source citations). Only states with verified, non-duplicate data are included in each
            average.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">Download the Data</h2>
          <p className="text-sm leading-relaxed text-slate-600">
            The figures above are available as machine-readable feeds for research, journalism, and
            data-storytelling use — the same real numbers shown on this page, no additional
            processing.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`${PAGE_PATH}/data.json`}
              className="inline-flex items-center rounded-md border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              Download data.json
            </a>
            <a
              href={`${PAGE_PATH}/data.csv`}
              className="inline-flex items-center rounded-md border border-teal-600 bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              Download data.csv
            </a>
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
