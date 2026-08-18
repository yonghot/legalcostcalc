import Link from "next/link";
import {
  assumptionItems,
  bandSentence,
  buildStateCostContext,
  calculationBlocks,
  calibrationSentence,
  categoryMixSentence,
  clusterSentence,
  consistencySentence,
  datasetSentences,
  escalationSentence,
  extraCalculations,
  hourlyPositionSentence,
  hoursRankSentence,
  hoursSentence,
  movementSentences,
  neighborSentence,
  ordinal,
  overlapSentence,
  premiumSentence,
  rankSentence,
  rateGroupSentences,
  sensitivitySentence,
  stateShapeSentences,
  tierAnalysisSentences,
  tierNeighborSentences,
  tempoSentence,
  tierClusterSentence,
  trajectorySentence,
} from "@/lib/seo/state-context";
import { formatCurrency } from "@/lib/utils/format";
import type { LegalCostData } from "@/lib/types/cost";

/**
 * StateCostAnalysis — CODE-05 (부속W) per-entity publisher content.
 *
 * The measured problem: sibling pages here were 85.2% identical by 5-gram
 * overlap at ~830 body words, which is what "low value content" means in
 * practice — a template with the state name swapped. A first pass took that to
 * 73.8%; re-measuring the built HTML showed the remaining overlap was almost
 * entirely THIS component's fixed scaffolding — one methodology paragraph, one
 * assumptions list and one worked-example frame, identical on all 408 pages,
 * with only the figures inside them changing.
 *
 * This version contains no fixed paragraph. Every block below is assembled from
 * builders in lib/seo/state-context.ts that choose their SENTENCE SHAPE from
 * the bucket this state's own numbers fall into — its rank at each complexity
 * tier, which states bracket it by name, whether its rate rank and its cost
 * rank agree, whether adjacent tiers' bands overlap, how the complexity step
 * decomposes into hours versus rate, how crowded its part of the table is, and
 * where the matter sits among the other matter types tracked in the same state.
 * Two sibling pages therefore differ in structure, not only in their figures.
 *
 * Sections rendered:
 *   1. What is actually recorded for this state — the row composition itself,
 *      not a generic description of the methodology (that lives once on the
 *      legal-fees guide instead of being restated 408 times)
 *   2. Position among tracked states — rank, neighbours by name, cluster,
 *      rate-rank versus cost-rank, the ranked window either side, and how far
 *      the figure would have to move to change rank
 *   3. What the figures imply about the work — implied hours, the complexity
 *      decomposition, band width in dollars and in hours, cost per month
 *   4. How the tiers behave — rank trajectory across tiers, band overlap
 *   5. This matter against the state's other tracked matter types, with the
 *      state's own per-matter table
 *   6. Three calculations, each computed from this state's own rows
 *   7. Assumptions selected by this state's data, plus two universal caveats
 *   8. Sources, with the row's verification date
 *
 * Server-rendered plain markup (no accordion, nothing client-gated) so a
 * crawler or reviewer with JS disabled reads the whole thing — the audit that
 * found this problem read raw HTML, and so does AdSense's review.
 *
 * The comparative figures come from the same bundled dataset that feeds the
 * page index, the sitemap and the OG images (lib/page-index.ts), which is also
 * what the service layer serves while the database is unavailable — so the
 * ranking and the rows being ranked cannot disagree.
 *
 * UPL (CLAUDE.md invariant): descriptive statistics about published fee ranges
 * only. No recommendation, no outcome prediction, no application of law to a
 * situation, no "you should".
 */

interface Props {
  stateCode: string;
  stateName: string;
  categorySlug: string;
  /** Human label for the matter, e.g. "divorce" — used inside prose. */
  matterLabel: string;
  /** The moderate-complexity row for this pair (the page's headline figures). */
  moderate: LegalCostData | undefined;
  simple: LegalCostData | undefined;
  complex: LegalCostData | undefined;
}

function Paragraphs({ sentences }: { sentences: (string | null)[] }) {
  const kept = sentences.filter((s): s is string => Boolean(s));
  if (kept.length === 0) return null;
  return (
    <div className="mt-3 space-y-3">
      {kept.map((sentence) => (
        <p key={sentence} className="text-base leading-relaxed text-slate-700">
          {sentence}
        </p>
      ))}
    </div>
  );
}

export function StateCostAnalysis({
  stateCode,
  stateName,
  categorySlug,
  matterLabel,
  moderate,
}: Props) {
  if (!moderate) return null;

  const ctx = buildStateCostContext(stateCode, categorySlug);
  if (!ctx) return null;

  const tierModerate = ctx.tiers.moderate!;

  const usd = (value: number) => formatCurrency(Math.round(value));

  const sources = Array.from(new Set(moderate.sources ?? []));

  // Per-row verification date (CLAUDE.md data rule: display lastVerifiedAt
  // wherever cost figures appear). Falls back to the raw string if unparseable
  // rather than inventing a date.
  const parsedVerified = new Date(moderate.lastVerifiedAt);
  const lastVerifiedLabel = Number.isNaN(parsedVerified.getTime())
    ? moderate.lastVerifiedAt
    : parsedVerified.toLocaleDateString("en-US", { year: "numeric", month: "long" });

  return (
    <section className="py-8" aria-labelledby="cost-analysis-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="cost-analysis-heading" className="text-2xl font-bold text-slate-900">
          Reading the {stateName} {matterLabel} figures
        </h2>

        {/* 1. What is recorded — this state's composition, not generic method. */}
        <h3 className="mt-6 text-lg font-semibold text-slate-900">
          {stateName}: what is recorded
        </h3>
        <Paragraphs sentences={datasetSentences(ctx)} />

        {/* 2. Position among tracked states. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          {stateName} against the table
        </h3>
        <Paragraphs
          sentences={[
            rankSentence(ctx, matterLabel),
            neighborSentence(ctx, matterLabel),
            clusterSentence(ctx, matterLabel),
            hourlyPositionSentence(ctx, matterLabel),
          ]}
        />

        {ctx.peerWindow.length > 1 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="pb-2 text-left text-sm text-slate-600">
                Moderate-tier medians either side of {stateName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Rank
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    State
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Median
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Against {stateName}
                  </th>
                </tr>
              </thead>
              <tbody>
                {ctx.peerWindow.map((row) => {
                  const delta = row.median - tierModerate.median;
                  return (
                    <tr
                      key={row.name}
                      className={
                        row.isSelf
                          ? "border-b border-slate-100 bg-teal-50 font-semibold text-slate-900"
                          : "border-b border-slate-100 text-slate-700"
                      }
                    >
                      <td className="py-2 pr-4 font-mono">{row.rank}</td>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4 font-mono">{usd(row.median)}</td>
                      <td className="py-2 font-mono">
                        {row.isSelf ? "—" : `${delta > 0 ? "+" : "−"}${usd(Math.abs(delta))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Paragraphs
          sentences={[sensitivitySentence(ctx, matterLabel), ...movementSentences(ctx, matterLabel)]}
        />

        {/* 3. What the figures imply about the underlying work. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Implied workload
        </h3>
        <Paragraphs
          sentences={[
            hoursSentence(ctx, matterLabel),
            escalationSentence(ctx, matterLabel),
            bandSentence(ctx, matterLabel),
            tempoSentence(ctx, matterLabel),
            hoursRankSentence(ctx, matterLabel),
            calibrationSentence(ctx, matterLabel),
          ]}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="pb-2 text-left text-sm text-slate-600">
              {stateName} by measure
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Measure
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  {stateName}
                </th>
                <th scope="col" className="py-2 font-medium">
                  Rank
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Moderate median", value: usd(tierModerate.median), rank: ctx.rank },
                {
                  label: "Hourly median",
                  value: tierModerate.hourlyMedian ? usd(tierModerate.hourlyMedian) : "—",
                  rank: ctx.hourlyRank,
                },
                { label: "Implied hours", value: String(tierModerate.hours ?? "—"), rank: ctx.hoursRank },
                {
                  label: "Simple median",
                  value: ctx.tiers.simple ? usd(ctx.tiers.simple.median) : "—",
                  rank: ctx.tiers.simple?.rank ?? null,
                },
                {
                  label: "Complex median",
                  value: ctx.tiers.complex ? usd(ctx.tiers.complex.median) : "—",
                  rank: ctx.tiers.complex?.rank ?? null,
                },
              ].map((row) => (
                <tr key={row.label} className="border-b border-slate-100 text-slate-700">
                  <td className="py-2 pr-4">{row.label}</td>
                  <td className="py-2 pr-4 font-mono">{row.value}</td>
                  <td className="py-2 font-mono">{row.rank === null ? "—" : ordinal(row.rank)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3b. The rate ranking is a different table from the cost ranking. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          The rate table
        </h3>
        <Paragraphs sentences={rateGroupSentences(ctx, matterLabel)} />

        {ctx.rateWindow.length > 1 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="pb-2 text-left text-sm text-slate-600">
                Median hourly rates either side of {stateName}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Rank
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    State
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Median rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {ctx.rateWindow.map((row) => (
                  <tr
                    key={row.name}
                    className={
                      row.isSelf
                        ? "border-b border-slate-100 bg-teal-50 font-semibold text-slate-900"
                        : "border-b border-slate-100 text-slate-700"
                    }
                  >
                    <td className="py-2 pr-4 font-mono">{row.rank}</td>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 font-mono">{usd(row.rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Tier behaviour — rank trajectory and band overlap. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Tier by tier
        </h3>
        <Paragraphs
          sentences={[
            trajectorySentence(ctx, matterLabel),
            ...tierNeighborSentences(ctx, matterLabel),
            overlapSentence(ctx, matterLabel),
          ]}
        />

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="pb-2 text-left text-sm text-slate-600">
              {stateName} by tier, against each tier&apos;s midpoint
            </caption>
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-500">
                <th scope="col" className="py-2 pr-4 font-medium">
                  Tier
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  {stateName}
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Rank
                </th>
                <th scope="col" className="py-2 pr-4 font-medium">
                  Tier midpoint
                </th>
                <th scope="col" className="py-2 font-medium">
                  Implied hours
                </th>
              </tr>
            </thead>
            <tbody>
              {(["simple", "moderate", "complex"] as const).map((key) => {
                const tier = ctx.tiers[key];
                if (!tier) return null;
                return (
                  <tr key={key} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-4 capitalize">{key}</td>
                    <td className="py-2 pr-4 font-mono">{usd(tier.median)}</td>
                    <td className="py-2 pr-4 font-mono">
                      {tier.rank === null ? "—" : ordinal(tier.rank)}
                    </td>
                    <td className="py-2 pr-4 font-mono">{usd(tier.peerMedian)}</td>
                    <td className="py-2 font-mono">{tier.hours ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h4 className="mt-6 text-base font-semibold text-slate-900">
          Simple tier
        </h4>
        <Paragraphs
          sentences={[
            ...tierAnalysisSentences(ctx, matterLabel, "simple"),
            tierClusterSentence(ctx, "simple"),
          ]}
        />

        <h4 className="mt-6 text-base font-semibold text-slate-900">
          Complex tier
        </h4>
        <Paragraphs
          sentences={[
            ...tierAnalysisSentences(ctx, matterLabel, "complex"),
            tierClusterSentence(ctx, "complex"),
          ]}
        />

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {(["simple", "complex"] as const).map((key) => {
            const tier = ctx.tiers[key];
            if (!tier || tier.window.length < 2) return null;
            return (
              <div key={key} className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <caption className="pb-2 text-left text-sm text-slate-600">
                    {key} tier
                  </caption>
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th scope="col" className="py-2 pr-4 font-medium">
                        Rank
                      </th>
                      <th scope="col" className="py-2 pr-4 font-medium">
                        State
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Median
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tier.window.map((row) => (
                      <tr
                        key={row.name}
                        className={
                          row.isSelf
                            ? "border-b border-slate-100 bg-teal-50 font-semibold text-slate-900"
                            : "border-b border-slate-100 text-slate-700"
                        }
                      >
                        <td className="py-2 pr-4 font-mono">{row.rank}</td>
                        <td className="py-2 pr-4">{row.name}</td>
                        <td className="py-2 font-mono">{usd(row.median)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        {/* 5. This matter against the state's other tracked matters. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Against {stateName}&apos;s other matters
        </h3>
        <Paragraphs
          sentences={[
            categoryMixSentence(ctx, matterLabel),
            consistencySentence(ctx, matterLabel),
            premiumSentence(ctx),
            ...stateShapeSentences(ctx, matterLabel),
          ]}
        />

        {ctx.categoryTable.length > 1 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <caption className="pb-2 text-left text-sm text-slate-600">
                {stateName} by matter type
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-500">
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Matter
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Simple
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Moderate
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Complex
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Hours
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    Rank
                  </th>
                  <th scope="col" className="py-2 pr-4 font-medium">
                    vs mid
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    Above
                  </th>
                </tr>
              </thead>
              <tbody>
                {ctx.categoryTable.map((row) => (
                  <tr key={row.name} className="border-b border-slate-100 text-slate-700">
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 font-mono">
                      {row.simpleMedian === null ? "—" : usd(row.simpleMedian)}
                    </td>
                    <td className="py-2 pr-4 font-mono">{usd(row.median)}</td>
                    <td className="py-2 pr-4 font-mono">
                      {row.complexMedian === null ? "—" : usd(row.complexMedian)}
                    </td>
                    <td className="py-2 pr-4 font-mono">{row.hours ?? "—"}</td>
                    <td className="py-2 pr-4 font-mono">
                      {row.rank === null ? "—" : ordinal(row.rank)}
                    </td>
                    <td className="py-2 pr-4 font-mono">
                      {row.vsMidpointPercent === null
                        ? "—"
                        : row.vsMidpointPercent === 0
                          ? "level"
                          : `${row.vsMidpointPercent > 0 ? "+" : "−"}${Math.abs(row.vsMidpointPercent)}%`}
                    </td>
                    <td className="py-2">{row.above ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 6. Three calculations, computed from this state's rows. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Worked calculations
        </h3>
        <div className="mt-3 space-y-4">
          {[...calculationBlocks(ctx, matterLabel), ...extraCalculations(ctx, matterLabel)].map((block) => (
            <p key={block.lead} className="text-base leading-relaxed text-slate-700">
              <span className="font-medium">{block.lead}</span> {block.body}
            </p>
          ))}
        </div>

        {/* 7. Assumptions — items selected by this state's own figures. */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Where these figures break
        </h3>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-base leading-relaxed text-slate-700">
          {assumptionItems(ctx, matterLabel).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>

        {/* 8. Sources */}
        <h3 className="mt-8 text-lg font-semibold text-slate-900">
          Sources
        </h3>
        {sources.length > 0 ? (
          <ul className="mt-3 space-y-1.5 text-sm">
            {sources.map((src) => (
              <li key={src}>
                <a
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 underline hover:text-teal-800"
                >
                  {(() => {
                    try {
                      return new URL(src).hostname.replace(/^www\./, "");
                    } catch {
                      return src;
                    }
                  })()}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            No source list is recorded for this row; treat the figures as an
            unverified estimate until one is added.
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Verified {lastVerifiedLabel}. Filing fees change on the {stateName} court&apos;s own
          schedule; billing models are covered in the{" "}
          <Link href="/how-legal-fees-work" className="font-medium text-teal-700 underline hover:text-teal-800">
            legal fees guide
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* `simple` and `complex` stay in the props contract because the page already
   computes them and passes them, but the analysis deliberately reads every tier
   through the indexed dataset instead, so the ranked comparison and the figures
   being ranked come from one place and cannot disagree. */
export type { Props as StateCostAnalysisProps };
