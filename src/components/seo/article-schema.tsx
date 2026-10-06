import { publisherNode, safeJsonLd } from "@/lib/utils/json-ld";
import { getReviewerConfig } from "@/lib/reviewer";

interface ArticleSchemaProps {
  /** Page headline — mirrors the page's H1. */
  headline: string;
  /** One-sentence description of the page content. */
  description: string;
  /** Canonical URL of the page. */
  url: string;
  /**
   * ISO date (YYYY-MM-DD) content was first published. No real per-page
   * publish date exists in this dataset, so we deliberately omit
   * `datePublished` rather than fabricate one (see CODE-02 no-fabrication
   * guardrail) unless a real value is supplied.
   */
  datePublished?: string | null;
  /**
   * ISO date (YYYY-MM-DD) the underlying cost data was last verified — MUST
   * come from a real verified-data field, never `new Date()`. Mirrors the
   * `dateModified` policy already used by SoftwareApplicationSchema.
   */
  dateModified?: string | null;
}

/**
 * CODE-02 — schema.org Article JSON-LD (still-supported 2026 rich-result set;
 * replaces the deprecated FAQPage/HowTo schema).
 *
 * Author and publisher are the publisher Organization
 * (src/lib/constants/publisher.ts). Only when a real, owner-configured reviewer
 * exists (NEXT_PUBLIC_REVIEWER_NAME via src/lib/reviewer.ts) is `author` a
 * schema.org Person; no team, reviewer or Person is ever invented.
 *
 * Serialised with safeJsonLd(); every field is an internal constant, env-held
 * reviewer name or real dataset date, never user or request input.
 */
export function ArticleSchema({
  headline,
  description,
  url,
  datePublished,
  dateModified,
}: ArticleSchemaProps) {
  const reviewer = getReviewerConfig();

  const author = reviewer
    ? {
        "@type": "Person",
        name: reviewer.name,
        ...(reviewer.credentials ? { honorificSuffix: reviewer.credentials } : {}),
      }
    : publisherNode();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author,
    publisher: publisherNode(),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static internal JSON-LD, escaped via safeJsonLd
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
