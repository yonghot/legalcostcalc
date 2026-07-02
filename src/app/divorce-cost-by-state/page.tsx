import { Metadata } from "next";
import { Disclaimer } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { AuthorByline } from "@/components/shared/author-byline";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { DivorceHubTable, type DivorceHubRow } from "@/components/seo/divorce-hub-table";
import { DivorceHubFaqLink } from "@/components/seo/divorce-hub-faq-link";
import { INDEXABLE_PAGES, getCostByComplexity } from "@/lib/page-index";
import { buildMeta } from "@/lib/seo";
import { DEFAULT_FIGURES_LAST_VERIFIED } from "@/lib/constants/figures";

export const revalidate = 604800; // 7 days

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    // Tool-intent, keyword-first title (K07 — never a pure "what is"
    // informational title): the page IS the comparison tool.
    title: "Divorce Cost by State Calculator",
    description:
      "Compare estimated divorce costs across all 50 states and DC — uncontested vs. contested, with typical attorney fee ranges. Free, sourced, and dated.",
    path: "/divorce-cost-by-state",
  });
}

export default function DivorceCostByStatePage() {
  // K07 — real per-state simple/complex figures from the seed dataset,
  // framed as uncontested (simple) vs. contested (complex) divorce cost —
  // the actual complexity semantics already used sitewide (T09
  // hasUniqueData gate, CostResult's complexity selector). No interpolation,
  // no invented numbers: every cell is a real costs.json row or a dash.
  const rows: DivorceHubRow[] = INDEXABLE_PAGES.filter((p) => p.category.slug === "divorce")
    .sort((a, b) => a.state.name.localeCompare(b.state.name))
    .map((p) => ({
      key: p.state.code,
      stateName: p.state.name,
      href: p.path,
      uncontested: getCostByComplexity(p.state.code, "divorce", "simple"),
      contested: getCostByComplexity(p.state.code, "divorce", "complex"),
    }));

  return (
    <div>
      <BreadcrumbSchema
        items={[
          { name: "Home", href: "/" },
          { name: "Divorce Cost by State", href: "/divorce-cost-by-state" },
        ]}
      />

      <section className="bg-gradient-to-b from-teal-50 to-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: "Divorce Cost by State", href: "/divorce-cost-by-state" },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <UpdatedBadge lastVerified={DEFAULT_FIGURES_LAST_VERIFIED} />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Divorce Cost by State: Uncontested vs. Contested (2026)
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Compare estimated divorce costs across all 50 states and the District of
            Columbia. Figures below show typical total cost ranges for an{" "}
            <strong className="font-semibold text-slate-800">uncontested</strong> divorce
            (both spouses agree on terms) versus a{" "}
            <strong className="font-semibold text-slate-800">contested</strong> divorce
            (disputed terms requiring court hearings and negotiation).
          </p>

          <AuthorByline lastUpdated={DEFAULT_FIGURES_LAST_VERIFIED} className="mt-6" />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            How these estimates are built
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Each state&apos;s figures below are drawn from the same sourced dataset used
            throughout LegalCostCalc: attorney hourly rates, typical court filing fees,
            mediation costs, and case-duration data compiled from public legal-cost
            surveys and bar association resources (see each state page&apos;s &ldquo;Data
            Sources&rdquo; list for citations). The{" "}
            <strong className="font-medium text-slate-800">uncontested</strong> figure
            reflects the &ldquo;simple&rdquo; complexity tier — spouses in agreement on
            property division, custody, and support, typically resolved through document
            preparation and a single court filing. The{" "}
            <strong className="font-medium text-slate-800">contested</strong> figure
            reflects the &ldquo;complex&rdquo; tier — disputed terms requiring discovery,
            multiple hearings, and often expert witnesses, which is why the range runs
            substantially higher. This is general cost information only, not legal
            advice — actual costs vary by attorney, court, and the specific facts of a
            case.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Divorce Cost by State
          </h2>
          <DivorceHubTable rows={rows} />
          <p className="mt-3 text-xs text-slate-400">
            Figures shown are median estimated total costs (attorney fees + court costs)
            for each complexity tier. See an individual state page for the full range,
            hourly rates, typical duration, and cited sources.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-slate-900">
                What&apos;s the difference between an uncontested and contested divorce?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                An uncontested divorce means both spouses agree on all major terms —
                property division, custody, and support — and is typically resolved with
                paperwork and a single filing. A contested divorce involves disputes that
                require court hearings, discovery, and negotiation, which substantially
                increases attorney time and total cost.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">
                Why do divorce costs vary so much by state?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Court filing fees, average attorney hourly rates, and mandatory steps
                (e.g., parenting classes or mediation requirements) differ by state and
                county, which is why the typical range shifts state to state. Select your
                state above for exact filing-fee and hourly-rate figures.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">
                Can I estimate my own divorce cost more precisely?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Yes — use the <DivorceHubFaqLink /> to select your state and case
                complexity for a more specific estimated range, including hourly rate and
                typical duration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer />
        </div>
      </section>
    </div>
  );
}
