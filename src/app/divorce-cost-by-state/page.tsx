import { Metadata } from "next";
import { Disclaimer, DisclaimerNote } from "@/components/shared/disclaimer";
import { BreadcrumbSchema } from "@/components/seo/breadcrumb-schema";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { AuthorByline } from "@/components/shared/author-byline";
import { UpdatedBadge } from "@/components/shared/updated-badge";
import { DivorceHubTable, type DivorceHubRow } from "@/components/seo/divorce-hub-table";
import { DivorceHubFaqLink } from "@/components/seo/divorce-hub-faq-link";
import { INDEXABLE_PAGES, getCostByComplexity } from "@/lib/page-index";
import { buildMeta } from "@/lib/seo";
import { getFamilyDate } from "@/lib/content-dates";

export const revalidate = 604800; // 7 days

export async function generateMetadata(): Promise<Metadata> {
  return buildMeta({
    // Tool-intent, keyword-first title (K07 — never a pure "what is"
    // informational title): the page IS the comparison tool.
    title: "Divorce Cost by State Calculator",
    description:
      "Compare estimated divorce costs across all 50 states and DC — uncontested vs. contested, with a median estimate for each state. Free, sourced, and dated.",
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
          <DisclaimerNote />

          <Breadcrumbs
            className="mt-8 mb-4"
            items={[
              { name: "Home", href: "/" },
              { name: "Divorce Cost by State", href: "/divorce-cost-by-state" },
            ]}
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <UpdatedBadge record={getFamilyDate("page:divorce-cost-by-state")} />
          </div>

          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Divorce Cost by State: Uncontested vs. Contested (2026)
          </h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Compare estimated divorce costs across all 50 states and the District of
            Columbia. Figures below show the median estimated total cost for an{" "}
            <strong className="font-semibold text-slate-800">uncontested</strong> divorce
            (both spouses agree on terms) versus a{" "}
            <strong className="font-semibold text-slate-800">contested</strong> divorce
            (disputed terms).
          </p>

          <AuthorByline
            lastUpdated={getFamilyDate("page:divorce-cost-by-state")?.date ?? null}
            basis={getFamilyDate("page:divorce-cost-by-state")?.basis}
            className="mt-6"
          />
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            How these estimates are built
          </h2>
          <p className="text-sm leading-relaxed text-slate-600">
            Each state&apos;s figures below are estimates modeled from published national
            fee guides and rate surveys, not quotes from firms in that state. For divorce,
            the sources cited on every state page are the Nolo and LegalZoom guides to what
            a divorce costs, Clio&apos;s lawyer-rate comparison and the U.S. Bureau of Labor
            Statistics page on lawyers (see the &ldquo;Sources&rdquo; list on each state
            page). The{" "}
            <strong className="font-medium text-slate-800">uncontested</strong>{" "}figure
            reflects the &ldquo;simple&rdquo; complexity tier — spouses in agreement on
            property division, custody, and support. The{" "}
            <strong className="font-medium text-slate-800">contested</strong>{" "}figure
            reflects the &ldquo;complex&rdquo; tier — disputed terms. This is general
            cost information only, not legal advice — actual costs vary by attorney,
            court, and the specific facts of a case.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-xl font-semibold text-slate-900">
            Divorce Cost by State
          </h2>
          <DivorceHubTable rows={rows} />
          <p className="mt-3 text-xs text-slate-600">
            Figures shown are median estimated total costs for each complexity tier. See
            an individual state page for the full range, hourly rate, assumed duration,
            and cited sources.
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
                property division, custody, and support. A contested divorce involves
                disputes over those terms. The table above shows the median estimate for
                each tier in every state.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">
                Where do the state divorce figures come from?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                The figures here are modeled from national guides and rate surveys, so they
                show each state&apos;s modeled range and hourly rate rather than a count of
                its local court fees. Open a state page for its range, hourly rate, and
                sources.
              </p>
            </div>
            <div>
              <h3 className="font-medium text-slate-900">
                Is there a calculator for a single state?
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Yes — use the <DivorceHubFaqLink /> to select a state and case complexity
                for its estimated range, including hourly rate and assumed duration.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Disclaimer id="disclaimer" />
        </div>
      </section>
    </div>
  );
}
