# DESIGN.md — LegalCostCalc Design System

## 1. Design Philosophy
Professional, trustworthy, accessible. Legal cost information demands credibility. Clean layouts, clear hierarchy, prominent data, and always-visible disclaimers.

## 2. Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#0D9488` (Teal 600) | CTAs, active states, key metrics |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--secondary` | `#F0FDFA` (Teal 50) | Backgrounds, cards |
| `--accent` | `#115E59` (Teal 800) | Headings, emphasis |
| `--destructive` | `#DC2626` (Red 600) | Errors, warnings |
| `--muted` | `#F1F5F9` (Slate 100) | Disabled, borders |
| `--background` | `#FFFFFF` | Page background |
| `--foreground` | `#0F172A` (Slate 900) | Body text |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--border` | `#E2E8F0` (Slate 200) | Borders, dividers |

## 3. Typography
- **Font Family**: Inter (Google Fonts) — body and UI
- **Headings**: Inter, semi-bold (600)
- **Body**: Inter, regular (400), 16px base
- **Monospace**: JetBrains Mono — cost figures, data
- **Scale**: 14/16/18/20/24/30/36/48px

## 4. Spacing System
Tailwind default: 4px base unit.
- `gap-2` (8px) — tight groups
- `gap-4` (16px) — standard spacing
- `gap-6` (24px) — section gaps
- `gap-8` (32px) — major sections
- `p-6` (24px) — card padding
- `py-16` (64px) — page section padding

## 5. Component Patterns
- **Cards**: `rounded-lg border shadow-sm p-6` (shadcn Card)
- **Buttons**: `rounded-md px-4 py-2 font-medium` (shadcn Button)
- **Inputs/Selects**: `rounded-md border h-10 px-3` (shadcn Select)
- **Cost Display**: Large monospace numbers, teal highlight for median
- **Disclaimer Banner**: Yellow-50 background, amber-700 text, rounded-lg

## 6. Layout
- **Max width**: 1280px centered
- **Grid**: 12-column, responsive breakpoints at sm/md/lg/xl
- **Header**: Sticky, white bg, logo left, nav right
- **Footer**: Dark (Slate 900), disclaimer + links + copyright
- **Mobile**: Single column, stacked cards, full-width selects

## 7. Responsive Breakpoints
| Breakpoint | Width | Layout |
|-----------|-------|--------|
| Mobile | <640px | Single column, stacked |
| Tablet | 640-1024px | 2-column results |
| Desktop | >1024px | Full layout, sidebar |

## 8. Animation & Motion
- Transitions: 150ms ease-in-out (default Tailwind)
- Cost results: fade-in on calculation
- No unnecessary animation — professional tone

## 9. Accessibility
- WCAG 2.1 AA compliance target
- All interactive elements keyboard-navigable
- Color contrast ratio 4.5:1+ for text
- Focus rings visible on all focusable elements
- Alt text on all images, aria-labels on icons

## 10. Key UI Screens
1. **Home**: Hero + category grid + state selector + trust signals
2. **Calculator Result**: Large cost range + breakdown + chart + disclaimer
3. **SEO Landing**: State+category page with embedded calculator
4. **Comparison**: Side-by-side 2-state comparison table

## 11. Iconography
- Lucide React icons (bundled with shadcn/ui)
- 20px default size, stroke-width 1.5
- Teal-600 for interactive, Slate-400 for decorative
