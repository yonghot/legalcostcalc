"use client";

import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calculator, Info } from "lucide-react";
import {
  estimateSettlementNet,
  DEFAULT_CONTINGENCY_PCT,
  type SettlementEstimatorOutput,
} from "@/lib/utils/settlement-estimator";
import { FOCUS_RING } from "@/lib/utils/styles";
import { useTermsGate, TermsGateInline } from "@/components/compliance/TermsGate";
import { ResultDisclaimer } from "@/components/compliance/ResultDisclaimer";
import { SETTLEMENT_CONTINGENCY_FIGURE } from "@/lib/constants/figures";

/** Formats a number as USD currency with no decimals (for display). */
function formatUSD(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

/**
 * UPL disclaimer specific to the settlement estimator.
 * Rendered at the top AND bottom of the estimator per the product invariant.
 */
const SETTLEMENT_DISCLAIMER =
  "Illustrative estimate for general informational purposes only, not legal " +
  "advice; we are not a law firm and no attorney-client relationship is " +
  "created by using this tool. Actual fees and costs vary by case and " +
  "jurisdiction and are set by the signed attorney-client agreement. The " +
  "typical one-third contingency shown here is a common pre-litigation rate " +
  "(ABA Model Rule 1.5(c); Nolo, 'Contingency Fee Basics'), not a prediction " +
  "or recommendation for any specific agreement.";

function SettlementDisclaimer() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-700"
          aria-hidden="true"
        />
        <p className="text-sm leading-relaxed text-amber-700">{SETTLEMENT_DISCLAIMER}</p>
      </div>
    </div>
  );
}

interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}

function NumberField({
  id,
  label,
  hint,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  min,
  max,
  step,
}: FieldProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium text-slate-900">
        {label}
      </Label>
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
      <div className="flex items-center rounded-md border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-1 focus-within:ring-teal-500">
        {prefix && (
          <span className="select-none px-3 py-2 text-sm text-slate-500">{prefix}</span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step ?? "any"}
          className={`w-full flex-1 rounded-md bg-transparent py-2 text-sm text-slate-900 placeholder-slate-400 outline-none ${prefix ? "" : "px-3"}`}
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        {suffix && (
          <span className="select-none px-3 py-2 text-sm text-slate-500">{suffix}</span>
        )}
      </div>
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
  muted?: boolean;
}

function ResultRow({ label, value, highlight, muted }: ResultRowProps) {
  return (
    <div
      className={`flex items-center justify-between rounded-md px-3 py-2 ${
        highlight ? "bg-teal-50" : muted ? "bg-slate-50" : ""
      }`}
    >
      <span className={`text-sm ${muted ? "text-slate-500" : "text-slate-700"}`}>{label}</span>
      <span
        className={`font-mono text-sm font-semibold ${
          highlight ? "text-teal-700" : muted ? "text-slate-500" : "text-slate-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export function SettlementEstimatorForm() {
  const uid = useId();
  const grossId = `${uid}-gross`;
  const pctId = `${uid}-pct`;
  const costsId = `${uid}-costs`;
  const resultsId = `${uid}-results`;

  const [gross, setGross] = useState("");
  const [pct, setPct] = useState(String(DEFAULT_CONTINGENCY_PCT));
  const [costs, setCosts] = useState("0");
  const [output, setOutput] = useState<SettlementEstimatorOutput | null>(null);
  const [touched, setTouched] = useState(false);
  const termsGate = useTermsGate();

  function parseInput(val: string, allowZero = true): number {
    const n = parseFloat(val);
    if (isNaN(n)) return allowZero ? 0 : NaN;
    return n;
  }

  function runCalculate() {
    setTouched(true);
    const result = estimateSettlementNet({
      grossSettlement: parseInput(gross, false),
      contingencyPct: parseInput(pct, false),
      caseCosts: parseInput(costs, true),
    });
    setOutput(result);
  }

  function handleCalculate() {
    // Clickwrap gate: before the FIRST calculation, require active consent.
    if (!termsGate.hasConsented) return;
    runCalculate();
  }

  function handleGateAccept() {
    const accepted = termsGate.accept();
    if (accepted) runCalculate();
  }

  const isDisabled = !gross || parseInput(gross, false) <= 0 || !termsGate.hasConsented;

  return (
    <div className="space-y-6">
      {/* Top disclaimer — product invariant */}
      <SettlementDisclaimer />

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-5 w-5 text-teal-600" aria-hidden="true" />
            Settlement Net Estimator
          </CardTitle>
          <p className="text-sm text-slate-500">
            Enter the gross settlement amount, your attorney&apos;s contingency fee percentage, and
            anticipated case costs to see an illustrative breakdown.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Inputs */}
          <div className="grid gap-5 sm:grid-cols-3">
            <NumberField
              id={grossId}
              label="Gross Settlement Amount"
              hint="Total amount before any deductions"
              value={gross}
              onChange={setGross}
              prefix="$"
              placeholder="100,000"
              min="1"
              step="100"
            />
            <NumberField
              id={pctId}
              label="Attorney Contingency Fee"
              hint="Typically 25–40%; default is 33.33%"
              value={pct}
              onChange={setPct}
              suffix="%"
              placeholder="33.33"
              min="0.01"
              max="99.99"
              step="0.01"
            />
            <NumberField
              id={costsId}
              label="Total Case Costs"
              hint="Expenses advanced by attorney (medicals, experts, filing fees)"
              value={costs}
              onChange={setCosts}
              prefix="$"
              placeholder="0"
              min="0"
              step="100"
            />
          </div>

          {/* Source citation */}
          <div className="flex items-start gap-2 rounded-md bg-slate-50 p-3">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" aria-hidden="true" />
            <p className="text-xs text-slate-500">
              The one-third (33.33%) default reflects the most common pre-litigation contingency
              rate in the United States.{" "}
              <a
                href="https://www.nolo.com/legal-encyclopedia/contingency-fees-lawyers-payment-28563.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
              >
                Nolo: Contingency Fee Basics
              </a>
              {"; "}
              <a
                href="https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_1_5_fees/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline hover:text-teal-700 ${FOCUS_RING} rounded-sm`}
              >
                ABA Model Rule 1.5 (Fees)
              </a>
              .
            </p>
          </div>

          <Button
            onClick={handleCalculate}
            disabled={isDisabled}
            className="w-full sm:w-auto"
          >
            Estimate My Net
          </Button>

          {/* Validation error for empty gross */}
          {touched && !gross && (
            <p className="text-sm text-red-600" role="alert">
              Please enter a gross settlement amount.
            </p>
          )}

          {/* Clickwrap gate — shown until consent is recorded, then never again. */}
          {termsGate.hasConsented === false && (
            <TermsGateInline
              checked={termsGate.checked}
              onCheckedChange={termsGate.setChecked}
              onAccept={handleGateAccept}
            />
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <div aria-live="polite" aria-label="Settlement estimate results" id={resultsId}>
        {output !== null && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Estimated Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {/* Error cases */}
              {!output.ok && output.error !== "COSTS_EXCEED_NET" && (
                <div
                  className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                  role="alert"
                >
                  {output.message}
                </div>
              )}

              {/* COSTS_EXCEED_NET — show $0 result with warning */}
              {!output.ok && output.error === "COSTS_EXCEED_NET" && (
                <>
                  <div
                    className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"
                    role="alert"
                  >
                    <strong>Warning:</strong> {output.message}
                  </div>
                  <ResultRow label="Gross Settlement" value={formatUSD(parseInput(gross, false))} />
                  <ResultRow
                    label={`Attorney Fee (${pct}%)`}
                    value={`− ${formatUSD(parseInput(gross, false) * (parseInput(pct, false) / 100))}`}
                    muted
                  />
                  <ResultRow
                    label="Case Costs"
                    value={`− ${formatUSD(parseInput(costs, true))}`}
                    muted
                  />
                  <ResultRow label="Estimated Client Net" value={formatUSD(0)} highlight />
                </>
              )}

              {/* Success */}
              {output.ok && (
                <>
                  <ResultRow
                    label="Gross Settlement"
                    value={formatUSD(parseInput(gross, false))}
                  />
                  <ResultRow
                    label={`Attorney Fee (${pct}%)`}
                    value={`− ${formatUSD(output.result.attorneyFeeUSD)}`}
                    muted
                  />
                  <ResultRow
                    label="Case Costs"
                    value={`− ${formatUSD(output.result.caseCostsUSD)}`}
                    muted
                  />
                  <div className="my-1 border-t border-slate-200" />
                  <ResultRow
                    label="Estimated Client Net"
                    value={formatUSD(output.result.estimatedNetUSD)}
                    highlight
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Estimated net is approximately{" "}
                    <span className="font-mono font-semibold">
                      {output.result.netPct.toFixed(1)}%
                    </span>{" "}
                    of the gross settlement.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ResultDisclaimer — layered UPL disclaimer ADJACENT to the result,
            supplementing SettlementDisclaimer above/below. No verified
            last-updated date exists for the contingency-rate constant used
            here (see lib/constants/figures.ts), so no date is shown — only
            the cited primary source, consistent with the no-fabrication
            rule. */}
        {output !== null && (
          <div className="mt-4">
            <ResultDisclaimer
              lastVerified={null}
              sourceUrl={SETTLEMENT_CONTINGENCY_FIGURE.source}
              sourceLabel="Nolo: Contingency Fee Basics"
            />
          </div>
        )}
      </div>

      {/* Bottom disclaimer — product invariant */}
      <SettlementDisclaimer />
    </div>
  );
}
