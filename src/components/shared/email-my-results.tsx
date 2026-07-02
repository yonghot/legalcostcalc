"use client";

/**
 * T17 — "Email my results" form. Renders ONLY when ALL of the following are
 * set (belt-and-suspenders — the server route independently re-checks
 * EMAIL_CAPTURE_ENDPOINT + NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED, which is the
 * real security boundary):
 *   - NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED === '1'
 *   - NEXT_PUBLIC_POSTAL_ADDRESS is set — the SAME CAN-SPAM postal-address
 *     gate used by the existing marketing EmailCapture component (repo
 *     guardrail: "keep the existing NEXT_PUBLIC_POSTAL_ADDRESS CAN-SPAM gate
 *     — both must be set"). Any commercial form collecting an email address
 *     for future messages requires a physical postal address to be
 *     displayed; this form shows one when present, per 15 U.S.C. § 7704(a)(5).
 *
 * Distinct from the existing marketing EmailCapture component
 * (email-capture.tsx, "get the 2026 report", /api/subscribe) — this form is
 * transactional-only: the email sent contains ONLY the result permalink,
 * zero promotional copy, so it stays inside the CAN-SPAM/CASL transactional
 * exemption. A SEPARATE, ALWAYS-UNCHECKED marketing opt-in checkbox is the
 * only path to future promotional email (express opt-in; never pre-checked).
 *
 * SENSITIVE SITE (legalcostcalc): shareUrl is always the clean category/
 * state-level URL from usePathname() — zero query params, zero input state
 * (same construction as ResultShare/T15).
 *
 * On success fires trackEvent('email_signup', { placement: 'result_card' }).
 */

import { useState, useId, type FormEvent } from "react";
import { usePathname } from "next/navigation";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/utils/styles";
import { trackEvent } from "@/lib/analytics";
import { CANONICAL_ORIGIN } from "@/lib/seo";

interface EmailMyResultsProps {
  /** calc_type for the request payload / email_signup event. */
  calcType: string;
  className?: string;
}

const EMAIL_CAPTURE_ENABLED = process.env.NEXT_PUBLIC_EMAIL_CAPTURE_ENABLED === "1";
const POSTAL_ADDRESS = process.env.NEXT_PUBLIC_POSTAL_ADDRESS?.trim() || null;

export function EmailMyResults({ calcType, className }: EmailMyResultsProps) {
  const pathname = usePathname();
  const inputId = useId();
  const marketingCheckboxId = useId();
  const [email, setEmail] = useState("");
  // Always starts unchecked — express opt-in only, never pre-checked.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  // Env-gated — renders nothing (not even a hidden form) unless BOTH the
  // enable flag AND the CAN-SPAM postal address are set, so the form is
  // absent from the DOM entirely per the acceptance criterion.
  if (!EMAIL_CAPTURE_ENABLED || !POSTAL_ADDRESS) return null;

  const shareUrl = `${CANONICAL_ORIGIN}${pathname}`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");

    try {
      const res = await fetch("/api/email-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, calcType, shareUrl, marketingOptIn }),
      });
      if (res.ok) {
        setStatus("done");
        trackEvent("email_signup", { placement: "result_card" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div
        className={`rounded-lg border border-teal-200 bg-teal-50 p-4 ${className ?? ""}`}
        role="status"
      >
        <p className="flex items-center gap-2 text-sm font-medium text-teal-800">
          <Check className="h-5 w-5" aria-hidden="true" />
          Sent — check your inbox for a link to this result.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-teal-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900">Email my results</h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        We&apos;ll send you a link to this result. No promotional content — just the estimate.
      </p>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <label htmlFor={inputId} className="sr-only">
          Email address
        </label>
        <input
          id={inputId}
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className={`min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 ${FOCUS_RING}`}
        />
        <Button type="submit" disabled={status === "submitting"} className="flex-shrink-0">
          {status === "submitting" ? "Sending..." : "Email me this result"}
        </Button>
      </form>

      <div className="mt-3 flex items-start gap-2">
        <input
          id={marketingCheckboxId}
          type="checkbox"
          checked={marketingOptIn}
          onChange={(e) => setMarketingOptIn(e.target.checked)}
          className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded border-slate-300 text-teal-600 ${FOCUS_RING}`}
        />
        <label htmlFor={marketingCheckboxId} className="text-xs text-slate-500">
          Also email me when 2026 legal cost data changes (separate from this one-time result email).
        </label>
      </div>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Something went wrong. Please try again later.
        </p>
      )}
      {POSTAL_ADDRESS && (
        <p className="mt-2 text-xs text-slate-400">{POSTAL_ADDRESS}</p>
      )}
    </div>
  );
}
