"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmbedSnippetProps {
  /** Path to the embeddable calculator, e.g. "/embed/california/divorce-cost". */
  embedPath: string;
  /** Canonical (full-page) path the attribution link should point to. */
  canonicalPath: string;
  /** Human label for the iframe title + link text. */
  label: string;
}

// Production origin used in the generated snippet so partners copy absolute URLs.
const SITE_ORIGIN = "https://legalcostcalc.co";

/**
 * Renders a copy-paste embed snippet: an <iframe> plus a "Powered by
 * LegalCostCalc" attribution <a> that the partner places in their PAGE HTML
 * (outside the iframe) so the backlink is SEO-visible.
 */
export function EmbedSnippet({ embedPath, canonicalPath, label }: EmbedSnippetProps) {
  const [copied, setCopied] = useState(false);

  const snippet = `<iframe
  src="${SITE_ORIGIN}${embedPath}"
  title="${label}"
  width="100%"
  height="720"
  style="border:1px solid #e2e8f0;border-radius:8px;max-width:768px;"
  loading="lazy"
></iframe>
<p style="font-size:12px;text-align:center;">
  <a href="${SITE_ORIGIN}${canonicalPath}" target="_blank" rel="noopener">
    Powered by LegalCostCalc
  </a>
</p>`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) — the user can still
      // select the text manually.
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-base font-semibold text-slate-900">Embed snippet</h2>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" /> Copy
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
        <code>{snippet}</code>
      </pre>
    </div>
  );
}
