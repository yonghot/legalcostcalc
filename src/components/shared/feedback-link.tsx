"use client";

import { openFeedback } from "./feedback-events";

export function FeedbackLink({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openFeedback} className={className}>
      Send feedback
    </button>
  );
}
