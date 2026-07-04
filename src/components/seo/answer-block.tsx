import type { AnswerBlock as AnswerBlockData } from "@/lib/seo/geo";

interface AnswerBlockProps {
  block: AnswerBlockData;
  /** Slightly denser spacing for the embed widget's smaller viewport. */
  compact?: boolean;
}

/**
 * CODE-01 — server-rendered GEO answer block: query-phrased H2, a 40-60 word
 * answer paragraph with real computed numbers, a compact cost-breakdown
 * table, a cost-factor list, >=2 inline source-attributed stats, and a dated
 * freshness marker. Rendered as the FIRST content block on both the full
 * /[state]/[slug] page and the /embed/[state]/[slug] page so cited embeds
 * carry the same extractable passage (부속P §4 CODE-01).
 *
 * Pure server component — no client JS, so the structure is present in the
 * initial HTML response (verifiable via curl with JS disabled).
 */
export function AnswerBlock({ block, compact = false }: AnswerBlockProps) {
  const { heading, answer, tableRows, factors, stats, freshnessLabel } = block;

  return (
    <section className={compact ? "mb-6" : "border-b border-slate-100 bg-white py-10 sm:py-12"}>
      <div className={compact ? "" : "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"}>
        <h2 className={compact ? "text-lg font-bold text-slate-900" : "text-2xl font-bold text-slate-900"}>
          {heading}
        </h2>

        <p className="mt-3 text-base leading-relaxed text-slate-700">{answer}</p>

        {freshnessLabel && (
          <p className="mt-2 text-xs font-medium text-slate-500">
            Data verified: {freshnessLabel}
          </p>
        )}

        {tableRows.length > 0 && (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[420px] border-collapse text-sm">
              <caption className="sr-only">
                Cost breakdown by case complexity for {heading}
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th scope="col" className="py-2 pr-4">
                    Complexity
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Low
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    Median
                  </th>
                  <th scope="col" className="py-2 pr-4">
                    High
                  </th>
                  <th scope="col" className="py-2">
                    Typical Duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => (
                  <tr key={row.complexity} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-800">{row.complexity}</td>
                    <td className="py-2 pr-4 font-mono text-slate-600">{row.costLow}</td>
                    <td className="py-2 pr-4 font-mono font-semibold text-teal-700">
                      {row.costMedian}
                    </td>
                    <td className="py-2 pr-4 font-mono text-slate-600">{row.costHigh}</td>
                    <td className="py-2 text-slate-600">{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {factors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-900">
              What affects this cost
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              {factors.map((factor) => (
                <li key={factor}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {stats.length > 0 && (
          <ul className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
            {stats.map((stat) => (
              <li key={stat.text}>
                {stat.text}{" "}
                <a
                  href={stat.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 underline hover:text-teal-700"
                >
                  ({stat.sourceLabel})
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
