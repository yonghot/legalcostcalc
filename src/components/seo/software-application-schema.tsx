import { safeJsonLd } from "@/lib/utils/json-ld";

interface SoftwareApplicationSchemaProps {
  /** Tool name, e.g. "Divorce Cost Calculator". */
  name: string;
  /** One-sentence description of what the tool estimates. */
  description: string;
  /** Canonical URL of the page hosting the tool. */
  url: string;
}

/**
 * Schema.org SoftwareApplication (WebApplication subtype) JSON-LD for a
 * calculator/tool page. Helps Google/AI surface the interactive tool.
 *
 * NOTE: We deliberately do NOT emit aggregateRating/review — there is no real
 * rating data, and inventing it would be a structured-data policy violation.
 * `offers` advertises the tool as free (price 0), which is factual.
 *
 * Security: content is serialised via safeJsonLd() (escapes "<" to "<"),
 * matching the existing SEO-schema components in this repo. All inputs are
 * internal, controlled strings — no untrusted/user content reaches this script.
 */
export function SoftwareApplicationSchema({
  name,
  description,
  url,
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
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static internal JSON-LD, escaped via safeJsonLd
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
