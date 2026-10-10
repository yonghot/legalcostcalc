"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FOCUS_RING } from "@/lib/utils/styles";
import {
  answerNotice,
  subscribeConsentNotice,
  type ConsentChoice,
  type NoticeMode,
} from "./consent-config";

export function moveFocusInto(dialog: HTMLElement | null, opener: HTMLElement | null): () => void {
  dialog?.focus();
  return () => {
    if (opener?.isConnected) opener.focus();
  };
}

export function ConsentNotice({
  mode,
  onChoose,
}: {
  mode: NoticeMode;
  onChoose: (value: ConsentChoice) => void;
}) {
  const declineOnly = mode === "decline-only";
  const dialogRef = useRef<HTMLDivElement>(null);
  useEffect(() => moveFocusInto(dialogRef.current, document.activeElement as HTMLElement | null), []);
  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="false"
      aria-label="Cookie consent"
      aria-describedby="consent-notice-text"
      tabIndex={-1}
      data-consent-mode={mode}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white px-4 py-4 shadow-md focus:outline-none sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {declineOnly ? (
          <p id="consent-notice-text" className="text-sm text-slate-700">
            Google’s consent message did not open on this device. You can decline
            analytics and advertising cookies here. The{" "}
            <Link href="/privacy#cookies" className="text-teal-700 underline">
              cookies section of our Privacy Policy
            </Link>{" "}
            explains what they do.
          </p>
        ) : (
          <p id="consent-notice-text" className="text-sm text-slate-700">
            We use cookies to measure site traffic and to display ads (Google
            AdSense). You can opt out at any time via “Manage Consent” in the footer.{" "}
            See our{" "}
            <Link href="/privacy" className="text-teal-700 underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        )}
        <div className="flex flex-shrink-0 gap-3">
          <button
            onClick={() => onChoose("declined")}
            className={`min-h-11 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 ${FOCUS_RING}`}
          >
            Decline
          </button>
          {!declineOnly && (
            <button
              onClick={() => onChoose("accepted")}
              className={`min-h-11 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-800 ${FOCUS_RING}`}
            >
              Accept
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CookieConsentBanner() {
  const [mode, setMode] = useState<NoticeMode | null>(null);

  useEffect(() => subscribeConsentNotice(setMode), []);

  if (!mode) return null;

  return (
    <ConsentNotice
      mode={mode}
      onChoose={(value) => {
        if (answerNotice(mode, value)) setMode(null);
      }}
    />
  );
}
