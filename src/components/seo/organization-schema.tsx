/**
 * Schema.org WebSite + Organization structured data for E-E-A-T signals.
 * Used on the home page to help Google understand the site.
 *
 * T11: adds a `contributor` entry describing the honest editorial-team
 * authorship model already disclosed in <AuthorByline> ("LegalCostCalc
 * Editorial Team", reviewer pending) — deliberately NOT a schema.org Person
 * with an invented name/credentials (no-fabrication guardrail).
 * `dateModified` is driven by the same real, verified dataset date used
 * everywhere else (DEFAULT_FIGURES_LAST_VERIFIED), never a render-time stamp.
 *
 * CODE-02: the WebSite node also carries `potentialAction: SearchAction`
 * (Sitelinks Searchbox eligibility) pointing at the real /compare?states=...
 * comparison route — this is part of the still-supported 2026 rich-result
 * set that replaces the deprecated FAQPage/HowTo schema previously emitted
 * elsewhere on this site.
 *
 * K06: when a real reviewer is configured (src/lib/reviewer.ts,
 * NEXT_PUBLIC_REVIEWER_NAME), an ADDITIONAL `reviewedBy` Person entry is
 * included — this only ever reflects an owner-supplied real name/credential,
 * never a fabricated one. When unset, the schema graph is unchanged from
 * before this wave.
 *
 * Security note (unchanged pattern from before this wave): content is
 * rendered via `safeJsonLd()`, which escapes '<' before injection into
 * `dangerouslySetInnerHTML`, matching every other JSON-LD component in this
 * repo (see src/lib/utils/json-ld.ts) — this is the repo's established safe
 * pattern for structured data (not raw/untrusted HTML), and all fields here
 * are internal, hardcoded/constant strings or owner-supplied env values, not
 * user/request-derived content.
 */

import { safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";
import { getReviewerConfig } from "@/lib/reviewer";

export function OrganizationSchema() {
  const reviewer = getReviewerConfig();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "LegalCostCalc",
        url: CANONICAL_ORIGIN,
        description:
          "Free legal cost calculator providing estimated attorney fees and court costs across all 50 US states for 8 legal categories.",
        ...(DEFAULT_FIGURES_LAST_VERIFIED
          ? { dateModified: DEFAULT_FIGURES_LAST_VERIFIED }
          : {}),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${CANONICAL_ORIGIN}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        publisher: {
          "@type": "Organization",
          name: "LegalCostCalc",
          url: CANONICAL_ORIGIN,
          logo: {
            "@type": "ImageObject",
            url: `${CANONICAL_ORIGIN}/icon-512.svg`,
          },
        },
      },
      {
        "@type": "Organization",
        name: "LegalCostCalc",
        url: CANONICAL_ORIGIN,
        description:
          "Transparent legal cost information tool providing source-verified cost estimates for common legal matters across all US states.",
        foundingDate: "2026",
        knowsAbout: [
          "Legal costs",
          "Attorney fees",
          "Court costs",
          "Legal services pricing",
        ],
        // Honest editorial-team authorship model — see AuthorByline. Not a
        // fabricated Person entity (no invented name/credentials).
        contributor: {
          "@type": "Organization",
          name: "LegalCostCalc Editorial Team",
        },
        // K06 — only present when a real reviewer is env-configured (see
        // module docs above). No name/credential is ever invented here.
        ...(reviewer
          ? {
              reviewedBy: {
                "@type": "Person",
                name: reviewer.name,
                ...(reviewer.credentials ? { honorificSuffix: reviewer.credentials } : {}),
              },
            }
          : {}),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
