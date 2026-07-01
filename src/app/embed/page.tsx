import { Metadata } from "next";
import Link from "next/link";
import { Disclaimer } from "@/components/shared/disclaimer";
import { EmbedSnippet } from "@/components/embed/embed-snippet";
import { CATEGORIES } from "@/lib/constants/categories";
import { DEFAULT_STATE_SLUG } from "@/lib/constants/costs";
import { STATE_BY_SLUG } from "@/lib/constants/states";
import { FOCUS_RING } from "@/lib/utils/styles";

export const metadata: Metadata = {
  title: "Embed the Legal Cost Calculator",
  description:
    "Add the free LegalCostCalc cost calculator to your own website with a single iframe snippet. Includes attribution markup for SEO.",
  alternates: { canonical: "/embed" },
};

export default function EmbedIndexPage() {
  const defaultCategory = CATEGORIES[0];
  const defaultState = STATE_BY_SLUG.get(DEFAULT_STATE_SLUG);
  const embedPath = `/embed/${DEFAULT_STATE_SLUG}/${defaultCategory.slug}-cost`;
  const canonicalPath = `/${DEFAULT_STATE_SLUG}/${defaultCategory.slug}-cost`;

  return (
    <div>
      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
          <nav className="mt-8 text-sm text-slate-500">
            <Link href="/" className={`rounded-sm hover:text-teal-600 ${FOCUS_RING}`}>
              Home
            </Link>
            <span className="mx-2">/</span>
            <span>Embed</span>
          </nav>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Embed the Legal Cost Calculator
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Add our free, interactive legal cost calculator to your own site. Copy the
            snippet below — it includes an attribution link that belongs in your page&apos;s
            HTML (not inside the iframe) so search engines can credit the source.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <EmbedSnippet
            embedPath={embedPath}
            canonicalPath={canonicalPath}
            label={`${defaultState?.name ?? ""} ${defaultCategory.displayName} Cost Calculator`.trim()}
          />

          <div className="mt-10 space-y-4 text-sm text-slate-600">
            <h2 className="text-lg font-semibold text-slate-900">How it works</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                The <code className="rounded bg-slate-100 px-1">&lt;iframe&gt;</code> loads the
                calculator in minimal chrome (no nav, no footer, no ads).
              </li>
              <li>
                The <code className="rounded bg-slate-100 px-1">&lt;a&gt;</code> attribution link
                lives in <em>your</em> page HTML — this is what passes SEO value. A link inside
                the iframe would not count.
              </li>
              <li>
                Swap the state and category in the URL to embed any of our{" "}
                {CATEGORIES.length} categories across all 50 states (e.g.{" "}
                <code className="rounded bg-slate-100 px-1">/embed/texas/dui-cost</code>).
              </li>
            </ul>
            <p>
              Prefer to link instead? Just point your readers at the full{" "}
              <Link href={canonicalPath} className={`text-teal-600 hover:text-teal-700 ${FOCUS_RING} rounded-sm`}>
                cost calculator page
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
