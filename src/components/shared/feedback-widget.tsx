"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, ChevronDown } from "lucide-react";
import { FOCUS_RING } from "@/lib/utils/styles";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SITE = "legalcostcalc.co";
const MAX_MESSAGE = 2000;

type FeedbackType = "bug" | "feature" | "other";
type PanelState = "idle" | "open" | "submitting" | "success" | "error";

const FEEDBACK_TYPE_OPTIONS: { value: FeedbackType; label: string }[] = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "other", label: "Other" },
];

// ---------------------------------------------------------------------------
// Helper: shared input base classes
// ---------------------------------------------------------------------------

const inputBase =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
  "placeholder:text-slate-400 transition-colors hover:border-slate-400 " +
  "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 " +
  "focus:ring-offset-2 disabled:opacity-50";

// ---------------------------------------------------------------------------
// FeedbackWidget
// ---------------------------------------------------------------------------

export function FeedbackWidget() {
  const [panelState, setPanelState] = useState<PanelState>("idle");
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  // Refs for focus management
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLSelectElement>(null);

  const isOpen =
    panelState === "open" ||
    panelState === "submitting" ||
    panelState === "error" ||
    panelState === "success";
  const isBusy = panelState === "submitting";

  // closePanel must be declared before the useEffect that references it
  const closePanel = useCallback(() => {
    setPanelState("idle");
    // Return focus to the trigger button
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  // Move focus into the panel when it opens
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closePanel();
        return;
      }

      if (e.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(
          "button, select, input, textarea, [tabindex]:not([tabindex='-1'])",
        ),
      ).filter((el) => !el.hasAttribute("disabled"));

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closePanel]);

  const openPanel = () => {
    setStatusMsg("");
    setPanelState("open");
  };

  const reset = () => {
    setType("bug");
    setMessage("");
    setEmail("");
    setStatusMsg("");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!message.trim()) {
      setStatusMsg("Please enter a message before submitting.");
      setPanelState("error");
      return;
    }

    setPanelState("submitting");
    setStatusMsg("");

    const payload = {
      type,
      message: message.trim(),
      email: email.trim() || undefined,
      pageUrl:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined,
      site: SITE,
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };

      if (res.ok && data.ok) {
        setStatusMsg("Thanks — we got your feedback!");
        setPanelState("success");
        reset();
        // Auto-close after a short delay so the user reads the success message
        setTimeout(() => {
          closePanel();
        }, 2500);
      } else {
        setPanelState("error");
        setStatusMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setPanelState("error");
      setStatusMsg(
        "A network error occurred. Please check your connection and try again.",
      );
    }
  }

  return (
    <>
      {/* Floating action button / panel — fixed bottom-right, safe-area aware */}
      <div
        className={[
          "fixed bottom-6 right-6 z-40",
          "pb-[env(safe-area-inset-bottom,0px)]",
          "pr-[env(safe-area-inset-right,0px)]",
        ].join(" ")}
      >
        {!isOpen && (
          <button
            ref={triggerRef}
            onClick={openPanel}
            aria-label="Open feedback panel"
            aria-haspopup="dialog"
            aria-expanded={false}
            className={[
              "flex items-center gap-2 rounded-full bg-teal-600 py-2.5 pl-3 pr-4",
              "text-sm font-semibold text-white shadow-md",
              "transition-colors hover:bg-teal-700",
              FOCUS_RING,
            ].join(" ")}
          >
            <MessageSquare className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Feedback</span>
          </button>
        )}

        {/* Compact feedback panel */}
        {isOpen && (
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Send feedback"
            className={[
              "w-[min(calc(100vw-3rem),380px)]",
              "rounded-lg border border-slate-200 bg-white shadow-md",
              "flex flex-col",
              "motion-safe:animate-[fadeIn_150ms_ease]",
            ].join(" ")}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageSquare
                  className="h-4 w-4 text-teal-600 shrink-0"
                  aria-hidden="true"
                />
                <h2 className="text-sm font-semibold text-slate-900">Send Feedback</h2>
              </div>
              <button
                onClick={closePanel}
                aria-label="Close feedback panel"
                className={[
                  "rounded p-1 text-slate-500 transition-colors hover:text-slate-900",
                  FOCUS_RING,
                ].join(" ")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 p-4">
              {/* Type select */}
              <div>
                <label
                  htmlFor="feedback-type"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Type
                </label>
                <div className="relative">
                  <select
                    id="feedback-type"
                    ref={firstFocusableRef}
                    value={type}
                    onChange={(e) => setType(e.target.value as FeedbackType)}
                    disabled={isBusy || panelState === "success"}
                    className={[inputBase, "appearance-none pr-8 cursor-pointer"].join(" ")}
                  >
                    {FEEDBACK_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="feedback-message"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Message{" "}
                  <span aria-hidden="true" className="text-red-500">
                    *
                  </span>
                </label>
                <textarea
                  id="feedback-message"
                  required
                  rows={4}
                  maxLength={MAX_MESSAGE}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isBusy || panelState === "success"}
                  placeholder="Describe the bug, feature request, or anything else…"
                  aria-required="true"
                  aria-describedby="feedback-message-counter feedback-status"
                  aria-invalid={
                    panelState === "error" && !message.trim() ? "true" : undefined
                  }
                  className={`${inputBase} resize-y`}
                />
                <p
                  id="feedback-message-counter"
                  className="mt-1 text-right text-xs text-slate-400"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {message.length}/{MAX_MESSAGE}
                </p>
              </div>

              {/* Email (optional) */}
              <div>
                <label
                  htmlFor="feedback-email"
                  className="mb-1.5 block text-xs font-medium text-slate-700"
                >
                  Email{" "}
                  <span className="text-slate-400 font-normal">
                    (optional — so we can follow up)
                  </span>
                </label>
                <input
                  id="feedback-email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBusy || panelState === "success"}
                  placeholder="you@example.com"
                  aria-describedby="feedback-status"
                  className={inputBase}
                />
              </div>

              {/* Status region — aria-live for screen readers */}
              <div
                id="feedback-status"
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="min-h-[1.25rem]"
              >
                {panelState === "success" && (
                  <p className="rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800">
                    {statusMsg}
                  </p>
                )}
                {panelState === "error" && statusMsg && (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                  >
                    {statusMsg}
                  </p>
                )}
              </div>

              {/* Actions */}
              {panelState !== "success" && (
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={closePanel}
                    className={[
                      "rounded-md px-3 py-2 text-xs font-medium text-slate-600",
                      "transition-colors hover:bg-slate-100 hover:text-slate-900",
                      FOCUS_RING,
                    ].join(" ")}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isBusy}
                    className={[
                      "rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white",
                      "transition-colors hover:bg-teal-700 disabled:opacity-50",
                      FOCUS_RING,
                    ].join(" ")}
                  >
                    {isBusy ? "Sending…" : "Submit"}
                  </button>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </>
  );
}
