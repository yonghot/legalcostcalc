export const OPEN_FEEDBACK_EVENT = "feedbackOpen";

export function openFeedback(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_FEEDBACK_EVENT));
}
