import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Legal Costs — LegalCostCalc",
  description:
    "Compare legal costs between states or across different legal categories. Side-by-side cost comparison for divorce, DUI, bankruptcy, and more.",
  openGraph: {
    title: "Compare Legal Costs — LegalCostCalc",
    description:
      "Compare legal costs between states or across different legal categories. Side-by-side cost comparison for divorce, DUI, bankruptcy, and more.",
    type: "website",
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
