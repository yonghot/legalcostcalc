"use client";

import { useEffect } from "react";

/** Message type identifier so host pages can distinguish our resize messages from others. */
const MESSAGE_TYPE = "legalcostcalc:embed-resize";

/**
 * CODE-03 — lightweight postMessage height-resize script. Posts the embed
 * iframe's full content height to the parent window whenever it changes
 * (initial mount, ResizeObserver-detected content changes, and window
 * resize), so a host page can size the <iframe> to fit without clipping —
 * reduces uninstalls from partners who'd otherwise see a cut-off widget.
 *
 * Purely additive: does not read or write any host-page state, and posts to
 * "*" only the height number + a namespaced message type (no user data).
 * Host pages that don't listen for the message are unaffected (the iframe
 * still renders correctly at its default height).
 */
export function EmbedResizeReporter() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    function postHeight() {
      const height = document.documentElement.scrollHeight;
      window.parent?.postMessage({ type: MESSAGE_TYPE, height }, "*");
    }

    postHeight();

    const observer = new ResizeObserver(() => postHeight());
    observer.observe(document.documentElement);
    window.addEventListener("resize", postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", postHeight);
    };
  }, []);

  return null;
}
