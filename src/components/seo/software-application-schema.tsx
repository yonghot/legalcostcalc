import { safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";

interface SoftwareApplicationSchemaProps {
  /** Tool name, e.g. "Divorce Cost Calculator". */
  name: string;
  /** One-sentence description of what the tool estimates. */
  description: string;
  /** Canonical URL of the page hosting the tool. */
  url: string;
  /**
   * T11: ISO date (YYYY-MM-DD) the underlying cost data was last verified —
   * MUST come from a real verified-data field (e.g. a cost row's
   * `lastVerifiedAt`), never `new Date()`. Emitted as `dateModified` only
   * when present; omitted entirely otherwise (no fabricated freshness).
   */
  dateModified?: string | null;
}

/**
 * Schema.org SoftwareApplication (WebApplication subtype) JSON-LD for a
 * calculator/tool page. Helps Google/AI surface the interactive tool.
 *
 * NOTE: We deliberately do NOT emit aggregateRating/review — there is no real
 * rating data, and inventing it would be a structured-data policy violation.
 * `offers` advertises the tool as free (price 0), which is factual.
 *
 * T11 E-E-A-T: adds `author`/`publisher` Organization linkage (mirrors
 * OrganizationSchema on the home page) and `dateModified` driven by the
 * page's real `lastVerifiedAt` data field — never stamped with the render
 * timestamp (anti-pattern #10, deceptive freshness).
 *
 * Security: content is serialised via safeJsonLd() (escapes "<" to "<"),
 * matching the existing SEO-schema components in this repo. All inputs are
 * internal, controlled strings — no untrusted/user content reaches this script.
 */
export function SoftwareApplicationSchema({
  name,
  description,
  url,
  dateModified,
}: SoftwareApplicationSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    ...(dateModified ? { dateModified } : {}),
    author: {
      "@type": "Organization",
      name: "LegalCostCalc",
      url: CANONICAL_ORIGIN,
    },
    publisher: {
      "@type": "Organization",
      name: "LegalCostCalc",
      url: CANONICAL_ORIGIN,
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static internal JSON-LD, escaped via safeJsonLd
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
