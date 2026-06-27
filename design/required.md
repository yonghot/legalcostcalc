# Required Patterns — Design Floor

Every new screen/component in `src/` must satisfy these. The design-reviewer
agent treats a miss as a blocking finding.

## Structure
- **Disclaimer top + bottom** on every page (`src/components/shared/disclaimer.tsx`).
  Non-negotiable UPL invariant (CLAUDE.md).
- **Source attribution** rendered wherever cost figures appear, with
  `lastVerifiedAt` date. Data >1yr shows the outdated warning.
- **Semantic landmarks**: one `<h1>` per page, `<main>`, nav/footer landmarks.

## Tokens
- Colors from `--primary/--secondary/--accent/--destructive/--muted/--border`
  (design/tokens.css ⇄ globals.css). No raw hex in components.
- Cost numbers in the monospace face, median highlighted teal (DESIGN.md §5).
- Spacing from the Tailwind 4px scale (`gap-2/4/6/8`, `p-6`, `py-16`).
- Radii: `rounded-lg` cards, `rounded-md` controls.

## Accessibility (WCAG 2.1 AA)
- Visible focus ring on every focusable element (`FOCUS_RING` constant,
  `src/lib/utils/styles.ts`).
- `htmlFor`/`id` pairing on every Label↔control.
- `aria-label` on icon-only buttons; `aria-hidden` on decorative icons.
- `aria-live="polite"` on async-updated regions (results, comparisons).
- Text contrast ≥ 4.5:1.

## Responsive
- Mobile-first single column → `sm:`/`md:`/`lg:` enhancement.
- No horizontal scroll at 320px. Full-width selects on mobile.

## Motion
- Transitions ≤ 150ms ease. Results fade-in only. Nothing bounces.
