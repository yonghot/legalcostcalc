"use client";

import { useState, useId, type FormEvent } from "react";
import { Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FOCUS_RING } from "@/lib/utils/styles";

interface EmailCaptureProps {
  /** Optional context label, e.g. "Divorce cost in California". */
  context?: string;
  className?: string;
}

/**
 * Lightweight, non-blocking email capture ("Email my result / Get the 2026 cost
 * report"). MECHANISM ONLY:
 *  - POSTs { email, context } to the same-origin route "/api/subscribe".
 *  - That route validates the email and, until storage/an ESP is wired, returns
 *    200 { ok: true } as a safe no-op (nothing is stored or sent).
 *
 * It never throws or blocks the page when unconfigured. Real email-provider
 * (ESP) wiring is an owner task — see TODO(owner) in src/app/api/subscribe/route.ts.
 */
export function EmailCapture({ context, className }: EmailCaptureProps) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">(
    "idle",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");

    // Same-origin endpoint. Safe to call unconditionally: when no storage/ESP is
    // configured server-side, /api/subscribe returns 200 { ok: true } (no-op).
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, context: context ?? null }),
      });
      setStatus(res.ok ? "done" : "error");
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
          Thanks — we&apos;ll be in touch with your 2026 cost report.
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-6 ${className ?? ""}`}>
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-teal-600" aria-hidden="true" />
        <h3 className="text-base font-semibold text-slate-900">
          Email my result
        </h3>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Get this estimate plus the 2026 legal cost report sent to your inbox.
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
          {status === "submitting" ? "Sending..." : "Send report"}
        </Button>
      </form>

      {status === "error" && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          Something went wrong. Please try again later.
        </p>
      )}
      <p className="mt-2 text-xs text-slate-400">
        We respect your privacy. No spam — unsubscribe anytime.
      </p>
    </div>
  );
}
