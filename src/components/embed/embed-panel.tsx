import { EmbedSnippet } from "@/components/embed/embed-snippet";

interface EmbedPanelProps {
  /** Path to the embeddable calculator, e.g. "/embed/california/divorce-cost". */
  embedPath: string;
  /** Canonical (full-page) path the attribution link should point to. */
  canonicalPath: string;
  /** Human label for the iframe title + link text. */
  label: string;
}

/**
 * CODE-03 — "Embed this calculator" panel shown directly on each main
 * calculator page (previously the copy-paste snippet only lived on the
 * standalone /embed index page). Thin wrapper around the existing
 * <EmbedSnippet> so the snippet markup + attribution `rel` policy stays
 * identical across every surface that offers it (per-vertical config only
 * changes the embedPath/canonicalPath/label values passed in).
 */
export function EmbedPanel({ embedPath, canonicalPath, label }: EmbedPanelProps) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-slate-900">
        Embed this calculator
      </h2>
      <p className="mb-4 text-sm text-slate-600">
        Add this calculator to your own site with a copy-paste snippet — includes an
        attribution link back to this page.
      </p>
      <EmbedSnippet embedPath={embedPath} canonicalPath={canonicalPath} label={label} />
    </div>
  );
}
