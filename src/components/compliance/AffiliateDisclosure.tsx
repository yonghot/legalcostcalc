/**
 * AffiliateDisclosure — FTC 16 CFR 255 disclosure for placement IMMEDIATELY
 * ABOVE every affiliate/lead CTA and partner table.
 *
 * Standard copy (project-wide): plain compensation disclosure PLUS the
 * "advertising, not a referral/recommendation" clarification required for
 * attorney-routing CTAs (UPL risk — we must not appear to be recommending or
 * endorsing a specific attorney/service).
 *
 * Renders unconditionally — callers place it directly above a CTA/table only
 * when that CTA/table is ALSO going to render (i.e. only when a live link
 * exists), matching the "adjacent to render" requirement.
 */

export function AffiliateDisclosure({ className }: { className?: string }) {
  return (
    <p className={`text-xs font-medium text-slate-500 ${className ?? ""}`}>
      We may earn a commission if you use links on this page. This does not
      affect the figures shown. These are advertisements. We do not recommend
      or endorse any attorney or service and receive flat advertising
      compensation, never a share of fees.
    </p>
  );
}
