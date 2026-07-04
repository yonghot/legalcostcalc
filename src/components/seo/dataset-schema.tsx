import { safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";

interface DatasetSchemaProps {
  /** Dataset name, e.g. "LegalCostCalc Legal Cost Statistics". */
  name: string;
  /** One-sentence description of what the dataset contains. */
  description: string;
  /** Canonical URL of the page describing/hosting the dataset. */
  url: string;
  /**
   * ISO date (YYYY-MM-DD) the underlying data was last verified — MUST come
   * from a real verified-data field (DATA_VERSION_DATE), never `new Date()`.
   */
  dateModified: string;
  /** Absolute URLs of the machine-readable feed variants (data.json/data.csv). */
  distributionUrls: { url: string; encodingFormat: "application/json" | "text/csv" }[];
}

/**
 * CODE-04 — schema.org Dataset JSON-LD for the /legal-cost-statistics
 * "linkable asset" page. Dataset is still fully supported for SERP/AI
 * indexing in 2026 (unlike FAQPage/HowTo, see CODE-02) and is the correct
 * markup for a page whose primary content is an aggregated, downloadable
 * statistical dataset rather than an article or a tool.
 *
 * All content serialized here is internal/controlled (page config + the
 * real aggregation computed in lib/seo/statistics.ts) — never raw
 * user/request input — and is escaped via safeJsonLd() before injection,
 * matching every other JSON-LD component already shipped in this repo
 * (article-schema.tsx, software-application-schema.tsx, breadcrumb-schema.tsx).
 */
export function DatasetSchema({
  name,
  description,
  url,
  dateModified,
  distributionUrls,
}: DatasetSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name,
    description,
    url,
    dateModified,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: {
      "@type": "Organization",
      name: "LegalCostCalc",
      url: CANONICAL_ORIGIN,
    },
    distribution: distributionUrls.map((d) => ({
      "@type": "DataDownload",
      contentUrl: d.url,
      encodingFormat: d.encodingFormat,
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static internal JSON-LD, escaped via safeJsonLd (see file-level note above)
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
