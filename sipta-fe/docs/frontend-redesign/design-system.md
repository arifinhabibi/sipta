# SIPTA v2 Design System

_Complete visual token specification for the redesigned frontend. All values live in `app/globals.css` and are consumable through both semantic utility classes (`bg-background`, `text-foreground`, `bg-primary`, …) and the remapped Tailwind default palette (`bg-blue-600`, `text-gray-500`, …)._

---

## 1. Layer model

SIPTA v2 uses a **4-layer surface model** to establish visual hierarchy without relying on shadows.

| Layer | Token | Purpose |
| --- | --- | --- |
| L0 — Canvas | `--sipta-background` | Root app surface. |
| L1 — Surface | `--sipta-surface` | Card, panel, form field. |
| L2 — Surface-2 | `--sipta-surface-2` | Subtle section band, table alt row. |
| L3 — Surface-3 | `--sipta-surface-3` | Hover, deeper subtle emphasis. |
| L4 — Elevated | `--sipta-surface-elevated` | Modal, dropdown, popover. |

## 2. Semantic colors

### Light theme

| Role | Value |
| --- | --- |
| background | `#F7F7F5` |
| surface | `#FFFFFF` |
| surface-2 | `#FAFAF9` |
| surface-3 | `#F1F1EF` |
| surface-elevated | `#FFFFFF` |
| foreground | `#0B0B0F` |
| foreground-strong | `#000000` |
| muted-fg | `#6B6A6B` |
| muted-fg-soft | `#8E8D8E` |
| border | `#E7E5E1` |
| border-strong | `#D6D3CE` |
| border-subtle | `#EFEDE9` |
| primary | `#4F46E5` |
| primary-hover | `#4338CA` |
| primary-strong | `#3730A3` |
| primary-fg | `#FFFFFF` |
| primary-subtle | `#EEF2FF` |
| success | `#059669` · subtle `#ECFDF5` |
| warning | `#B45309` · subtle `#FFFBEB` |
| destructive | `#DC2626` · subtle `#FEF2F2` |
| info | `#0369A1` · subtle `#F0F9FF` |
| accent (violet) | `#7C3AED` · subtle `#F5F3FF` |
| ring | `rgba(79,70,229,0.35)` |

### Dark theme

| Role | Value |
| --- | --- |
| background | `#0A0A0C` |
| surface | `#131318` |
| surface-2 | `#17171D` |
| surface-3 | `#1E1E25` |
| surface-elevated | `#1B1B22` |
| foreground | `#F5F5F4` |
| muted-fg | `#A3A3A6` |
| border | `#26262D` |
| border-strong | `#34343C` |
| primary | `#8B87F5` (lifted for dark bg contrast) |
| primary-fg | `#0A0A0C` |
| success | `#34D399` · warning `#F59E0B` · destructive `#F87171` · info `#38BDF8` |

## 3. Typography

| Face | Family | Use | CSS var |
| --- | --- | --- | --- |
| Display | **Bricolage Grotesque** (400 · 500 · 600 · 700 · 800) | H1–H3, hero numerals, brand titles, stat values | `--font-display` |
| Body / UI | **Geist Sans** | Everything else | `--font-geist-sans` (`--font-sans`) |
| Mono | **JetBrains Mono** | Time, monetary values, IDs, tabular numerals, code | `--font-mono` |

Automatic behaviors baked into `globals.css`:
- `h1, h2, h3` adopt display font with `-0.015em` letter-spacing.
- `.tabular-nums`, `[data-tabular]`, `code`, `.font-mono` receive JetBrains Mono + `font-variant-numeric: tabular-nums`.
- Body text uses Geist Sans with the OpenType features `cv11 ss01 ss03` enabled for premium letterforms.

### Scale

Tailwind default scale is preserved (`text-xs .. text-4xl`). Design guidance:

| Slot | Class | Weight |
| --- | --- | --- |
| Hero H1 | `text-3xl / 4xl` | `font-semibold` |
| Section H2 | `text-2xl` | `font-semibold` |
| Card title / H3 | `text-lg` | `font-semibold` |
| Metric value | `text-2xl / 3xl` tabular | `font-semibold` |
| Body | `text-sm / base` | `font-normal / medium` |
| Meta / caption | `text-xs` | `font-medium uppercase tracking-wide` |

## 4. Spacing & density

Tailwind defaults retained. Container maxima:
- App shell max: `max-w-7xl` (`1280px`).
- Modal/dialog max: `max-w-md / max-w-lg`.
- Prose max: `max-w-prose`.

Vertical rhythm target: **32–40 px** section gaps, **20–24 px** intra-section, **12 px** intra-card.

## 5. Radius

| Token | Value | Use |
| --- | --- | --- |
| `--radius-sm` | 6 px | small chips, inputs when compact |
| `--radius` | 10 px | inputs, buttons |
| `--radius-md` | 12 px | secondary cards |
| `--radius-lg` | 16 px | cards, section wrappers |
| `--radius-xl` | 20 px | hero panels |
| `--radius-2xl` | 24 px | full-bleed hero |
| `--radius-3xl` | 28 px | oversized display cards |

## 6. Shadows

Layered, subtle — never gaudy. Automatically dark-mode adjusted (stronger blur, denser opacity).

| Token | Purpose |
| --- | --- |
| `--shadow-xs` | Hairline separation |
| `--shadow-sm` | Cards at rest |
| `--shadow-md` | Cards on hover, elevated panels |
| `--shadow-lg` | Menus, dropdowns |
| `--shadow-xl` | Modals |
| `--shadow-inset-hairline` | Inner 1 px hairline for tokens/badges |

## 7. Motion

| Token | Value |
| --- | --- |
| `--dur-fast` | `120ms` |
| `--dur` | `180ms` |
| `--dur-slow` | `260ms` |
| `--ease-out-soft` | `cubic-bezier(.22,.61,.36,1)` |
| `--ease-in-out-soft` | `cubic-bezier(.4,0,.2,1)` |

Custom keyframes: `float`, `border-pulse`, `fade-in`, `shimmer`, `pulse-soft`.
Utility classes: `.animate-float`, `.animate-border-pulse`, `.animate-fade-in`, `.animate-pulse-soft`, `.sipta-skeleton` (auto-shimmer).
**Respects `prefers-reduced-motion`** — durations collapse to `1ms`.

## 8. Component states

| State | Behavior |
| --- | --- |
| Hover | Surface shifts one layer up (`surface → surface-3`); border strengthens; shadow gains one step. |
| Focus | 2 px `outline` in `--sipta-primary` at `2 px` offset. `focus-visible` only. |
| Active | Depress via `translateY(0)` + shadow removed. |
| Disabled | Opacity `0.6`, `cursor: not-allowed`, no hover shift. |
| Loading | Reduced opacity + spinner or skeleton shimmer. |
| Error | Border `--sipta-destructive`; helper text in destructive tone with `aria-invalid`. |

## 9. Responsive rules

Breakpoints follow Tailwind defaults (`sm 640` · `md 768` · `lg 1024` · `xl 1280` · `2xl 1536`). Design mandates:

- Mobile-first — every page must be readable and operable at 375 × 800 px.
- Touch targets ≥ 40 × 40 px (44 px for critical actions in the mobile nav).
- No horizontal overflow — enforced via `overflow-x-hidden` at page shells.
- Tables collapse to card lists (already implemented across `app/components/classrooms/*` and `app/components/reports/teachers/*`).
- Dialogs are max-width `md` and become full-width with `p-4` padding on `< sm`.
- Bottom-nav pattern retained on mobile via header drawer (v2 replaces the always-visible mobile row with a hamburger-toggled drawer).

## 10. Accessibility

- **Semantic HTML**: `<main>`, `<nav>`, `<aside>`, `<header>`, `<button type="button">`, `role="dialog|menu|alert|status"` where appropriate.
- **Focus rings** are always visible in `focus-visible`; never suppressed.
- **Icon-only buttons** carry `aria-label` (theme toggle, mobile hamburger, password reveal, logout menu button, dismiss buttons).
- **Form fields** wire `aria-invalid` + `aria-describedby` for error IDs.
- **Menus/dialogs** trap ephemeral focus expectations and expose `aria-modal="true"`, `aria-labelledby`.
- **Non-color status** — every status color is paired with an icon (heroicons/outline) and a label.
- **Contrast**: light-mode foreground on background pair reaches 15.2:1 (`#0B0B0F` on `#F7F7F5`); dark-mode 16:1 (`#F5F5F4` on `#0A0A0C`). Primary-fg on primary reaches 6.4:1 in light mode.
- **Reduced motion** honored globally.

## 11. Tailwind palette remap

To let ~80 legacy files inherit the redesign without a per-file migration, `@theme inline` in `globals.css` reassigns the built-in Tailwind palette:

| Legacy scale | New meaning |
| --- | --- |
| `blue-*`, `indigo-*` | Primary indigo scale (dark-mode aware). |
| `emerald-*`, `green-*` | Success. |
| `red-*`, `rose-*` | Destructive. |
| `yellow-*`, `amber-*` | Warning. |
| `gray-*`, `slate-*` | Stone-tinted neutral scale (dark-mode aware). |
| `purple-*`, `violet-*` | Secondary accent (fintech violet). |
| `cyan-*`, `sky-*` | Info. |

Legacy call sites like `bg-blue-600`, `border-gray-200`, `text-red-500`, `from-blue-50 via-white to-indigo-50` all resolve to design-system values automatically and switch on `.dark`.

**Caveat:** `--color-white` and `--color-black` are intentionally left static so hero surfaces that combine indigo gradients with `text-white` retain contrast; a small number of `bg-white` cards therefore stay literal white in dark mode — a deliberate design choice (light content on dark canvas) rather than a regression. Full per-file migration is a documented backlog item.
