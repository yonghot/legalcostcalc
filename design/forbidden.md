# Forbidden Patterns — Anti-Slop Guardrails

These are visual/code patterns that read as generic "AI slop" and are banned in
`src/`. The Anti-Slop hook (.claude/settings.json → PostToolUse) greps for the
machine-checkable subset and blocks the edit (exit 2). The rest are enforced by
the design-reviewer agent.

## Hard-blocked by hook (grep on Edit/Write under src/)
- `from-purple-*` / `to-blue-*` — the canonical "AI gradient." This product is
  teal-on-white. Brand gradients use teal tokens only (`from-teal-50 to-white`).
- `hover:scale-105` (and any `hover:scale-*`) — bouncy hover growth. DESIGN.md §8
  mandates calm 150ms transitions, no scale-on-hover.
- `#000000` / pure black — body text is `--foreground` (Slate 900), never #000.

> Note on fonts: generic anti-slop bans `Inter`, but LegalCostCalc **deliberately
> chose Inter** (DESIGN.md §3). It is therefore NOT in the hook grep pattern. The
> impeccable `overused-font` detector is satisfied via DESIGN.md context + inline
> `impeccable-disable-line overused-font` where a literal `font-family: Inter`
> appears. (Assumption logged in PROGRESS.md.)

## Forbidden by review (design-reviewer agent)
- Decorative gradients on cards, heroes beyond the documented teal wash.
- Glassmorphism / heavy `backdrop-blur` — not part of this design system.
- Emoji as UI iconography (use Lucide, DESIGN.md §11).
- More than one accent hue. Teal is the only brand color; red is reserved for
  destructive/error only.
- Arbitrary spacing (`p-[13px]`, `gap-[7px]`) — use the Tailwind 4px scale.
- Centered everything / hero-with-giant-gradient-headline layouts.
- Drop shadows heavier than `shadow-sm`/`shadow-md` (DESIGN.md §5).
- Animations longer than 200ms or with bounce/elastic easing.
- Removing or visually de-emphasizing the legal disclaimer (product invariant).
