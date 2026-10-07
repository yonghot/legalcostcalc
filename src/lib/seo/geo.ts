/**
 * lib/seo/geo.ts — CODE-01: passage-level GEO (Generative Engine
 * Optimization) answer-block builder.
 *
 * Per 부속P §4 CODE-01 (corrected numbers per §0): the highest-confidence,
 * fastest-lever content structure for AI-answer citation (Perplexity/ChatGPT
 * Search/AI Overviews) is a query-phrased H2, an immediate 40-60 word answer
 * paragraph with the REAL computed numbers, a compact data table, a cost-
 * factor list, and >=2 computed stats plus a visible
 * freshness marker. This module builds that structure from the page's own
 * already-computed cost data — it never invents numbers.
 *
 * `buildAnswerBlock` is a pure function (no JSX) so it can be unit-tested
 * independently of rendering, and reused identically by both the full
 * /[state]/[slug] page and the /embed/[state]/[slug] page (CODE-01
 * acceptance criterion: "Wire the same block into app/embed pages").
 */
import { aOrAn, formatCurrency } from "@/lib/utils/format";
import type { CategoryInfo } from "@/lib/types/category";
import type { StateInfo } from "@/lib/types/state";
import type { CostRange, LegalCostData } from "@/lib/types";
import { dateLabel, formatDate, type FamilyDate } from "@/lib/content-dates";

const MIN_ANSWER_WORDS = 40;
const MAX_ANSWER_WORDS = 60;

export interface AnswerBlockRow {
  complexity: string;
  costLow: string;
  costMedian: string;
  costHigh: string;
  duration: string;
}

export interface AnswerBlockStat {
  /** The statistic sentence itself, e.g. "The median cost is $2,250." */
  text: string;
}

export interface AnswerBlockSource {
  label: string;
  url: string;
}

export interface AnswerBlockEntity {
  category: CategoryInfo;
  state: StateInfo;
  /** All complexity rows for this (state, category) pair — real data only. */
  costs: LegalCostData[];
  /** The page family's content-dates record; null when none is recorded. */
  dateRecord: FamilyDate | null;
}

export interface AnswerBlock {
  /** Query-phrased H2 — the literal question, per GEO passage-independence research. */
  heading: string;
  /** 40-60 word paragraph stating the computed answer with real numbers. */
  answer: string;
  /** Word count of `answer`, exposed for the acceptance-criterion check/tests. */
  answerWordCount: number;
  /** Compact cost-breakdown table rows (one per complexity tier). */
  tableRows: AnswerBlockRow[];
  /** 5-10 cost factors driving the price, real per-category/state facts. */
  factors: string[];
  /** >=2 statistics computed from the rows. */
  stats: AnswerBlockStat[];
  /** The rows' sources, listed once as references and never matched to a figure. */
  sources: AnswerBlockSource[];
  /** "Updated <date>" or "Sources checked <date>" from the content-dates record, or null. */
  freshnessLabel: string | null;
  /** What the dollar figures in the table measure, when it is not the attorney's own fee. */
  costBasisNote: string | null;
}

function sourceHostLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return "cited source";
  }
}

function isContingencyMatter(
  moderate: LegalCostData | undefined,
): moderate is LegalCostData & { contingencyFee: CostRange } {
  return Boolean(moderate && moderate.hourlyRate.median <= 0 && moderate.contingencyFee);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Builds the neutral-tone 40-60 word answer paragraph. Superlative/promotional
 * language is deliberately excluded (GEO research: superlative tone
 * correlates -26% with citation) — only factual, sourced, dated statements.
 */
function buildAnswerParagraph(
  category: CategoryInfo,
  state: StateInfo,
  moderate: LegalCostData | undefined,
  dateRecord: FamilyDate | null,
): string {
  const catLower = category.displayName.toLowerCase();
  const asOf = dateRecord?.basis === "sources-rechecked" ? `As of ${formatDate(dateRecord.date, "day")}, ` : "";
  const sentence = (lead: string) => (asOf ? `${asOf}${lead}` : lead.charAt(0).toUpperCase() + lead.slice(1));
  const article = /^[aeiou]/.test(catLower) ? "an" : "a";

  if (!moderate) {
    return (
      `${sentence(`${catLower} cost data for ${state.name} is still being collected on LegalCostCalc.`)} ` +
      `General estimates for this legal matter typically depend on case complexity, attorney ` +
      `hourly rate, and court filing fees, which vary by county and jurisdiction within the state.`
    );
  }

  if (isContingencyMatter(moderate)) {
    const { low, high } = moderate.contingencyFee;
    const lead = `${catLower} attorneys typically work on contingency, commonly ${low}-${high}% of any recovery (a typical nationwide range, not specific to ${state.name}).`;
    return (
      `${sentence(lead)} ` +
      `Estimated case expenses for a moderate-complexity case in ${state.name} run ` +
      `${formatCurrency(moderate.costRange.low)}-${formatCurrency(moderate.costRange.high)}, ` +
      `median ${formatCurrency(moderate.costRange.median)}, covering filing fees, records and experts ` +
      "that the attorney may advance."
    );
  }

  // Fee-structure clause: hourly rate when it exists (most categories),
  // otherwise the real contingency-fee percentage (personal-injury rows,
  // billed on contingency rather than by the hour) — never fabricated,
  // always sourced from the page's own computed data.
  const feeClause =
    moderate.hourlyRate.median > 0
      ? ` Typical attorney rates run ${formatCurrency(moderate.hourlyRate.low)} to ` +
        `${formatCurrency(moderate.hourlyRate.high)} per hour.`
      : moderate.contingencyFee
        ? ` Attorneys typically handle this on a contingency basis, commonly ` +
          `${moderate.contingencyFee.low}-${moderate.contingencyFee.high}% of any settlement, ` +
          `rather than billing hourly.`
        : "";

  const duration = moderate.typicalDuration
    ? ` A moderate-complexity case typically takes ${moderate.typicalDuration} to resolve.`
    : "";

  const feesClause =
    moderate.commonFees.length > 0
      ? ` Common related costs include ${moderate.commonFees.slice(0, 2).join(" and ").toLowerCase()}.`
      : "";

  const opening = sentence(
    `${article} ${catLower} in ${state.name} costs on average ${formatCurrency(moderate.costRange.median)}, ` +
      `typically ${formatCurrency(moderate.costRange.low)}-${formatCurrency(moderate.costRange.high)} ` +
      `for a moderate-complexity case, based on sourced attorney-fee and court-cost data.`,
  );
  return `${opening}${feeClause}${duration}${feesClause}`;
}

/**
 * Fits the paragraph into the 40-60 word range while keeping it grammatically
 * whole (whole sentences only, never cut mid-sentence, which would corrupt a
 * real number).
 */
function fitAnswerWordRange(paragraph: string): string {
  let text = paragraph;

  if (countWords(text) > MAX_ANSWER_WORDS) {
    // Drop trailing sentences until within range, never mid-sentence.
    const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
    let acc = "";
    for (const sentence of sentences) {
      const candidate = acc + sentence;
      if (countWords(candidate) > MAX_ANSWER_WORDS && acc) break;
      acc = candidate;
    }
    text = acc.trim();
  }

  // A trimmed or short paragraph below the 40-word floor gets a generic,
  // non-fabricated closing clause; it never invents a number.
  if (countWords(text) < MIN_ANSWER_WORDS) {
    text = `${text} Actual cost depends on the specific facts of the case, the county where it is filed, and which attorney is retained.`.trim();
  }

  return text;
}

function buildFactors(category: CategoryInfo, costs: LegalCostData[]): string[] {
  const moderate = costs.find((c) => c.complexity === "moderate");
  const factors: string[] = [];

  factors.push("Case complexity (simple, moderate, or complex)");
  factors.push(
    isContingencyMatter(moderate)
      ? "Contingency fee percentage, which can rise if the case goes to trial"
      : "Attorney hourly rate, which varies by state and experience level",
  );

  if (moderate?.commonFees?.length) {
    for (const fee of moderate.commonFees.slice(0, 6)) {
      factors.push(fee);
    }
  }

  if (moderate?.contingencyFee) {
    factors.push("Fee arrangement (hourly vs. flat fee vs. contingency)");
  }

  factors.push(`Whether the ${category.displayName.toLowerCase()} matter proceeds to trial`);
  factors.push("Court filing fees and county-specific administrative costs");

  // Deduplicate while preserving order, cap at 10 per acceptance criteria.
  return Array.from(new Set(factors)).slice(0, 10);
}

function buildStats(
  category: CategoryInfo,
  state: StateInfo,
  costs: LegalCostData[],
): AnswerBlockStat[] {
  const moderate = costs.find((c) => c.complexity === "moderate");
  const simple = costs.find((c) => c.complexity === "simple");
  const complex = costs.find((c) => c.complexity === "complex");
  const stats: AnswerBlockStat[] = [];
  const contingency = isContingencyMatter(moderate);

  if (moderate && moderate.sources.length > 0) {
    stats.push({
      text: contingency
        ? `The median estimated case expense for a moderate-complexity ${category.displayName.toLowerCase()} case in ${state.name} is ` +
          `${formatCurrency(moderate.costRange.median)}.`
        : `The median ${category.displayName.toLowerCase()} cost in ${state.name} is ` +
          `${formatCurrency(moderate.costRange.median)} for a moderate-complexity case.`,
    });
  }

  if (moderate?.hourlyRate.median && moderate.sources.length > 0) {
    stats.push({ text: `Median attorney hourly rate: ${formatCurrency(moderate.hourlyRate.median)}/hr.` });
  }

  if (simple && complex && simple.sources.length > 0) {
    stats.push({
      text: contingency
        ? `Estimated case expenses run ${formatCurrency(simple.costRange.median)} for a simple case versus ` +
          `${formatCurrency(complex.costRange.median)} for a complex case — a difference tied mainly ` +
          "to the experts and depositions a contested matter requires."
        : `A simple case runs ${formatCurrency(simple.costRange.median)} versus ` +
          `${formatCurrency(complex.costRange.median)} for a complex case — a difference driven ` +
          "mainly by attorney hours and whether the matter is contested.",
    });
  }

  return stats.slice(0, 4);
}

function buildSources(costs: LegalCostData[]): AnswerBlockSource[] {
  const urls = [...new Set(costs.flatMap((c) => c.sources))];
  return urls.map((url) => ({ label: sourceHostLabel(url), url }));
}

function buildTableRows(costs: LegalCostData[]): AnswerBlockRow[] {
  const order: Record<string, number> = { simple: 0, moderate: 1, complex: 2 };
  return [...costs]
    .sort((a, b) => (order[a.complexity] ?? 9) - (order[b.complexity] ?? 9))
    .map((c) => ({
      complexity: c.complexity.charAt(0).toUpperCase() + c.complexity.slice(1),
      costLow: formatCurrency(c.costRange.low),
      costMedian: formatCurrency(c.costRange.median),
      costHigh: formatCurrency(c.costRange.high),
      duration: c.typicalDuration || "Varies",
    }));
}

/**
 * Builds the full GEO answer block for a (category, state) entity from its
 * already-computed cost rows. Returns null fields gracefully when the
 * underlying data is missing rather than fabricating figures — callers
 * should render nothing (or a minimal placeholder) in that case.
 */
export function buildAnswerBlock(entity: AnswerBlockEntity): AnswerBlock {
  const { category, state, costs, dateRecord } = entity;
  const moderate = costs.find((c) => c.complexity === "moderate");
  const freshnessLabel = dateRecord ? dateLabel(dateRecord, "day") : null;

  const rawAnswer = buildAnswerParagraph(category, state, moderate, dateRecord);
  const answer = fitAnswerWordRange(rawAnswer);

  return {
    heading: `How much does ${aOrAn(category.displayName)} ${category.displayName.toLowerCase()} cost in ${state.name}?`,
    answer,
    answerWordCount: countWords(answer),
    tableRows: buildTableRows(costs),
    factors: buildFactors(category, costs),
    stats: buildStats(category, state, costs),
    sources: buildSources(costs),
    freshnessLabel,
    costBasisNote: isContingencyMatter(moderate)
      ? "Dollar figures in this table are estimated case expenses (filing fees, records, experts), not attorney fees; the attorney's fee is a contingency percentage of any recovery."
      : null,
  };
}

/**
 * CODE-06 — one data-derived synthesis sentence per page, comparing the
 * page's own moderate-complexity median against the category's REAL
 * national-average median (computed in lib/page-index.ts from the same seed
 * dataset — never hardcoded). Phrasing is CONDITIONAL on the actual
 * direction/magnitude of the comparison ("above"/"below"/"in line with" the
 * national average) so pages differ structurally by their real numbers, not
 * just by variable substitution — this is the analytical-synthesis sentence
 * + conditional-phrasing requirement in 부속P §4 CODE-06.
 *
 * Returns null when either figure is missing/non-positive rather than
 * fabricating a comparison.
 */
export function buildBenchmarkSynthesis(params: {
  categoryDisplayName: string;
  stateName: string;
  localMedian: number | null | undefined;
  nationalAverage: number | null | undefined;
}): string | null {
  const { categoryDisplayName, stateName, localMedian, nationalAverage } = params;
  if (!localMedian || localMedian <= 0 || !nationalAverage || nationalAverage <= 0) return null;

  const catLower = categoryDisplayName.toLowerCase();
  const diffRatio = (localMedian - nationalAverage) / nationalAverage;
  const pctAbs = Math.round(Math.abs(diffRatio) * 100);
  const nationalFormatted = formatCurrency(Math.round(nationalAverage));
  const localFormatted = formatCurrency(localMedian);

  // Within +/-3% is treated as "in line with" rather than forcing an
  // above/below claim on a difference too small to be meaningful.
  if (pctAbs < 3) {
    return (
      `At ${localFormatted}, the median ${catLower} cost in ${stateName} is in line with the ` +
      `${nationalFormatted} national average across all 50 states and DC.`
    );
  }

  if (diffRatio > 0) {
    return (
      `At ${localFormatted}, the median ${catLower} cost in ${stateName} runs ${pctAbs}% above the ` +
      `${nationalFormatted} national average across all 50 states and DC.`
    );
  }

  return (
    `At ${localFormatted}, the median ${catLower} cost in ${stateName} runs ${pctAbs}% below the ` +
    `${nationalFormatted} national average across all 50 states and DC.`
  );
}
