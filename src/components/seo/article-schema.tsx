import { safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";
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

// NOTE ON SAFETY: this component mirrors the exact JSON-LD injection pattern
// already used sitewide (see breadcrumb-schema.tsx, faq-schema.tsx,
// software-application-schema.tsx, organization-schema.tsx). All fields
// serialized here are internal, controlled strings/constants (page config,
// env-configured reviewer name, or real dataset dates) — never raw
// user/request input. safeJsonLd() escapes "<"/">"/"&" before injection,
// matching Google's own "html safe" JSON serialization mode, which is the
// established defense-in-depth measure for this repo's JSON-LD components.
/**
 * CODE-02 — schema.org Article JSON-LD (author Person/Organization,
 * publisher Organization, dateModified=data-verified). Part of the
 * still-supported 2026 rich-result set (Article + BreadcrumbList +
 * SoftwareApplication/WebApplication + WebSite/SearchAction) that REPLACES
 * the deprecated FAQPage/HowTo schema previously emitted on these pages.
 *
 * Author identity: when a real, owner-configured reviewer exists
 * (NEXT_PUBLIC_REVIEWER_NAME via src/lib/reviewer.ts) we emit a genuine
 * schema.org Person as `author`. Otherwise `author` is the Organization
 * (LegalCostCalc Editorial Team) — never an invented Person. This mirrors
 * the exact no-fabrication pattern already established in
 * OrganizationSchema's `reviewedBy` field.
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
    : {
        "@type": "Organization",
        name: "LegalCostCalc Editorial Team",
        url: CANONICAL_ORIGIN,
      };

  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline,
    description,
    url,
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    author,
    publisher: {
      "@type": "Organization",
      name: "LegalCostCalc",
      url: CANONICAL_ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${CANONICAL_ORIGIN}/icon-512.svg`,
      },
    },
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- static internal JSON-LD, escaped via safeJsonLd (see file-level note above)
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
