# Design Principles — LegalCostCalc

Derived from DESIGN.md §1 (Design Philosophy) and the product's UPL-risk constraints.
These are the load-bearing rules the design-reviewer agent enforces.

## 1. Credibility over flair
Legal cost information must read as trustworthy. Clean layouts, clear hierarchy,
restraint in color and motion. No decorative gradients, no playful animation.
If a visual choice does not increase trust or comprehension, remove it.

## 2. Data is the hero
Cost figures are the primary content. Present them large, in the monospace
face (JetBrains Mono), with the median highlighted in brand teal. Everything
else is supporting structure.

## 3. The disclaimer is part of the design
Every page shows the legal disclaimer top and bottom (amber-700 on amber-50).
It is a first-class UI element, never an afterthought or a footer-only line.
This is a product invariant, not a style preference (see CLAUDE.md, UPL Risk).

## 4. Accessibility is non-negotiable
WCAG 2.1 AA: 4.5:1 text contrast, visible focus rings on every focusable
element, keyboard operability, aria-labels on icon-only controls. A design
that fails AA is a bug, not a polish item.

## 5. Token-driven, not ad hoc
Color/spacing/typography come from tokens (design/tokens.css ⇄ globals.css).
Inline one-off hex values or arbitrary spacing are drift and get flagged.

## 6. Mobile-first, content-first
Single column on mobile, progressive enhancement to 2-column (tablet) and full
layout (desktop). Never hide the calculator or the disclaimer on small screens.

## 7. Calm motion
150ms ease transitions, fade-in on results only. No scale-on-hover, no bounce,
no parallax. Motion communicates state change, nothing more.
