import { getTierFigures } from "@/lib/page-index";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function money(value: number): string {
  return usd.format(value);
}

export function HomePublisherContent() {
  const caSimple = getTierFigures("CA", "divorce", "simple");
  const caModerate = getTierFigures("CA", "divorce", "moderate");
  const caComplex = getTierFigures("CA", "divorce", "complex");
  const txModerate = getTierFigures("TX", "immigration", "moderate");

  if (!caSimple || !caModerate || !caComplex || !txModerate) return null;

  const caImpliedHours = caModerate.hourlyMedian
    ? Math.round(caModerate.median / caModerate.hourlyMedian)
    : null;

  return (
    <section className="border-y border-slate-100 bg-white py-16" aria-labelledby="home-methodology">
      <div className="mx-auto max-w-4xl space-y-10 px-4 sm:px-6 lg:px-8">
        <header>
          <h2 id="home-methodology" className="text-2xl font-bold text-slate-900">
            How the estimate is built
          </h2>
          <p className="mt-3 leading-7 text-slate-600">
            LegalCostCalc is a reference model, not a quote generator. The calculator selects a
            recorded row for the chosen state, legal category, and complexity tier rather than
            inventing a number from a visitor profile. Each row contains a low, median, and high
            total-cost estimate, an hourly-rate band where the source data supports one, a typical
            duration, common fee categories, source links, and a verification date. Showing a range
            is deliberate: two matters with the same label can require very different amounts of
            attorney time, filing work, discovery, expert evidence, negotiation, or court activity.
          </p>
          <p className="mt-3 leading-7 text-slate-600">
            The three complexity choices are descriptive buckets. “Simple” represents the lower
            part of the recorded workload, “moderate” is the central comparison case, and “complex”
            represents a matter with more procedural steps or professional time. They do not decide
            whether a real matter is legally simple or complex. The calculator also keeps attorney
            fees and common additional charges conceptually separate: filing fees, service costs,
            mediation, experts, translations, or records can be included differently by different
            providers. A written engagement agreement is the document that determines a real fee.
          </p>
        </header>

        <div>
          <h3 className="text-xl font-semibold text-slate-900">Two worked examples</h3>
          <div className="mt-4 space-y-5 text-slate-600">
            <p className="leading-7">
              <strong className="text-slate-900">Example 1 — California divorce tiers.</strong>{" "}
              The bundled dataset records a simple-tier median of {money(caSimple.median)}, a
              moderate-tier range of {money(caModerate.low)} to {money(caModerate.high)} with a
              {" "}{money(caModerate.median)} median, and a complex-tier median of
              {" "}{money(caComplex.median)}. The calculator reports the selected row; it does not
              average the three tiers. The distance between those medians illustrates why choosing
              a tier is a scenario comparison, not a diagnosis. It also explains why one national
              “average divorce price” would hide more information than it reveals.
            </p>
            <p className="leading-7">
              <strong className="text-slate-900">Example 2 — checking the hourly figure.</strong>{" "}
              The California moderate row records a median hourly rate of
              {" "}{caModerate.hourlyMedian ? money(caModerate.hourlyMedian) : "not available"}.
              {caImpliedHours
                ? ` Dividing the ${money(caModerate.median)} total median by that rate gives roughly ${caImpliedHours} hours.`
                : " The row does not support an implied-hours comparison."}
              {" "}That division is a transparency check, not a forecast of billable hours, because
              the total range can also reflect non-hourly charges. For comparison, the Texas
              moderate immigration row spans {money(txModerate.low)} to {money(txModerate.high)}.
              Changing both jurisdiction and matter changes the source row itself; no claim is made
              that one state or category is universally more expensive.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-slate-900">Assumptions and limits</h3>
          <div className="mt-3 space-y-3 leading-7 text-slate-600">
            <p>
              The model assumes that public market research and fee references are useful for
              comparing broad cost bands. It cannot see a case file, local procedural posture,
              attorney experience, billing agreement, opposing party, settlement timing, available
              insurance, fee waiver, or later change in law. Contingency, flat-fee, subscription,
              limited-scope, and hourly arrangements also behave differently. For that reason the
              output is educational information and must not be read as legal advice, a prediction
              of an outcome, or a recommendation to hire or avoid a particular professional.
            </p>
            <p>
              A result near the low or high edge is not evidence that a quote is fair or unfair. A
              quote may cover work that the dataset does not, and a low initial retainer may not be
              the final bill. The most useful comparison is item by item: what work is included,
              which costs are advanced separately, how often invoices are issued, what happens if
              the scope changes, and whether unused funds are refundable under the agreement.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-slate-900">Sources</h3>
          <p className="mt-3 leading-7 text-slate-600">
            The dataset uses publicly available legal-cost research and official fee information.
            Core references include the{" "}
            <a className="underline hover:text-teal-700" href="https://www.clio.com/resources/legal-trends/compare-lawyer-rates/" target="_blank" rel="noopener noreferrer">Clio lawyer-rate comparison</a>,{" "}
            <a className="underline hover:text-teal-700" href="https://www.bls.gov/ooh/legal/lawyers.htm" target="_blank" rel="noopener noreferrer">U.S. Bureau of Labor Statistics lawyers profile</a>,{" "}
            <a className="underline hover:text-teal-700" href="https://www.uscourts.gov/court-programs/bankruptcy/bankruptcy-basics" target="_blank" rel="noopener noreferrer">U.S. Courts bankruptcy information</a>, and{" "}
            <a className="underline hover:text-teal-700" href="https://www.uscis.gov/forms/filing-fees" target="_blank" rel="noopener noreferrer">USCIS filing-fee information</a>.
            Individual result pages show the references attached to their own data row. A later
            official fee schedule or a provider’s written terms should take precedence over the
            figures shown here.
          </p>
        </div>
      </div>
    </section>
  );
}
