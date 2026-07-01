import { Metadata } from "next";
import { safeJsonLd } from "@/lib/utils/json-ld";

export const metadata: Metadata = {
  title: "Compare Legal Costs — LegalCostCalc",
  description:
    "Compare legal costs between states or across different legal categories. Side-by-side cost comparison for divorce, DUI, bankruptcy, and more.",
  alternates: {
    canonical: "/compare",
  },
  openGraph: {
    title: "Compare Legal Costs — LegalCostCalc",
    description:
      "Compare legal costs between states or across different legal categories. Side-by-side cost comparison for divorce, DUI, bankruptcy, and more.",
    type: "website",
    url: "https://legalcostcalc.co/compare",
    siteName: "LegalCostCalc",
    locale: "en_US",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Compare Legal Costs",
    description:
      "Compare legal costs between US states or across different legal categories with side-by-side cost breakdowns.",
    url: "https://legalcostcalc.co/compare",
    isPartOf: {
      "@type": "WebSite",
      name: "LegalCostCalc",
      url: "https://legalcostcalc.co",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
      />
      {children}
    </>
  );
}
