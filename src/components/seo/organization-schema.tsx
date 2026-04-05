/**
 * Schema.org WebSite + Organization structured data for E-E-A-T signals.
 * Used on the home page to help Google understand the site.
 */

function safeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "LegalCostCalc",
        url: "https://legalcostcalc.vercel.app",
        description:
          "Free legal cost calculator providing estimated attorney fees and court costs across all 50 US states for 8 legal categories.",
        publisher: {
          "@type": "Organization",
          name: "LegalCostCalc",
          url: "https://legalcostcalc.vercel.app",
          logo: {
            "@type": "ImageObject",
            url: "https://legalcostcalc.vercel.app/icon-512.svg",
          },
        },
      },
      {
        "@type": "Organization",
        name: "LegalCostCalc",
        url: "https://legalcostcalc.vercel.app",
        description:
          "Transparent legal cost information tool providing source-verified cost estimates for common legal matters across all US states.",
        foundingDate: "2026",
        knowsAbout: [
          "Legal costs",
          "Attorney fees",
          "Court costs",
          "Legal services pricing",
        ],
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
