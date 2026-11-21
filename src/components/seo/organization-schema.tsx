/**
 * Schema.org WebSite + publisher Organization graph for the home page.
 *
 * The Organization node is the publisher (src/lib/constants/publisher.ts),
 * never a self-referencing node named after the site, and it states no
 * founding date, team, or review. `dateModified` comes from the home page's
 * content-dates record, never a render-time stamp.
 *
 * The WebSite node carries `potentialAction: SearchAction` pointing at the
 * real /search route.
 *
 * Content is serialised with safeJsonLd() (escapes '<', '>' and '&'); every
 * field is an internal constant, none is user or request derived.
 */

import { publisherNode, safeJsonLd } from "@/lib/utils/json-ld";
import { CANONICAL_ORIGIN } from "@/lib/seo";
import { getFamilyDate } from "@/lib/content-dates";
import { PUBLISHER } from "@/lib/constants/publisher";

export function OrganizationSchema() {
  const homeDate = getFamilyDate("page:home")?.date;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "LegalCostCalc",
        url: CANONICAL_ORIGIN,
        description:
          "Free legal cost calculator providing modeled cost estimates across all 50 US states for 8 legal categories.",
        ...(homeDate ? { dateModified: homeDate } : {}),
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${CANONICAL_ORIGIN}/search?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
        publisher: publisherNode(),
      },
      {
        ...publisherNode(),
        email: PUBLISHER.email,
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
