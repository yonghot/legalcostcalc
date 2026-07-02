/**
 * Schema.org WebSite + Organization structured data for E-E-A-T signals.
 * Used on the home page to help Google understand the site.
 *
 * T11: adds a `contributor` entry describing the honest editorial-team
 * authorship model already disclosed in <AuthorByline> ("LegalCostCalc
 * Editorial Team", reviewer pending) — deliberately NOT a schema.org Person
 * with an invented name/credentials (no-fabrication guardrail; there is no
 * real named/licensed reviewer yet). `dateModified` is driven by the same
 * real, verified dataset date used everywhere else
 * (DEFAULT_FIGURES_LAST_VERIFIED), never a render-time stamp.
 *
 * Security note (unchanged pattern from before this wave): content is
 * rendered via `safeJsonLd()`, which escapes '<' before injection into
 * `dangerouslySetInnerHTML`, matching every other JSON-LD component in this
 * repo (see src/lib/utils/json-ld.ts). All fields here are internal,
 * hardcoded/constant strings — no user or request-derived content.
 */

import { safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";

export function OrganizationSchema() {
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
