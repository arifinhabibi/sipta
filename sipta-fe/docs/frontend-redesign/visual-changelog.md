# Visual Changelog

_User-facing visual changes introduced by SIPTA v2. Feature and behavior are unchanged; presentation, hierarchy, and accessibility are elevated._

---

## Global

- **Typography** — Adopted a distinctive pairing:
  - **Bricolage Grotesque** for display headings, hero numerals, brand titles.
  - **Geist Sans** retained for body/UI text.
  - **JetBrains Mono** with tabular figures for times, statistics, and code.
- **Palette** — Refined fintech-grade indigo (`#4F46E5`) primary, warm stone neutrals, violet secondary accent, calibrated semantic status set. Legacy Tailwind color usage across the codebase automatically inherits the new palette.
- **Dark mode** — Full system-preference detection, manual toggle in the header, and localStorage persistence under `sipta-theme` (isolated from `auth-storage`). No-FOUC inline bootstrap ensures the correct theme is set before first paint.
- **Focus rings** — Consistent 2 px indigo focus ring at 2 px offset on every interactive element via `focus-visible`.
- **Reduced motion** — Global `prefers-reduced-motion` handling collapses animations to `1ms`.
- **Scrollbars** — Custom themed scrollbar rails (thin, tokenized colors).
- **Toaster** — react-hot-toast styled with semantic tokens, rounded 12 px, layered shadow, theme-aware.

## Application header (`HeaderComponent`)

Before: full-width blue/indigo gradient bar, always-visible mobile nav row, decorative-only profile dropdown.

After:
- Sticky hairline top-bar with subtle backdrop blur; hairline bottom border for elevation.
- Brand block: gradient-tile logomark + refined institution + academic-year meta line (single line with `·` separators).
- Desktop nav: 5 links with active-state underline animation.
- Mobile: hamburger toggle → slide-open drawer with active pill indicator.
- Right cluster: theme toggle + profile pill (avatar-initials + name + role).
- Profile dropdown: elevated card with user identity block, role badge, active academic year chip, `Profil saya` link, and destructive-toned `Keluar` action.
- Logout modal: iconified header, dismiss + confirm actions with proper aria semantics.

## Login (`/auth/login`)

Before: single-column card with multicolor gradient blobs and rainbow header.

After:
- **Desktop (≥ lg):** two-pane split. Left pane: permanent branded gradient (indigo → violet) with grid overlay, feature list, brand mark. Right pane: focused form column with 380 px max-width.
- **Mobile:** stacked layout with compact brand mark on top and the same form column.
- Icon-affordanced inputs (username with user icon, password with lock icon + reveal toggle).
- `aria-invalid` + `aria-describedby` wire error states to helper text.
- Primary CTA uses tokenized primary color with subtle shadow and disabled state.
- Permission warning renders as a semantic warning card with an underlined retry link.
- Footer retains the copyright line with muted styling.

## Dashboard (`/`)

Before: loud blue-to-indigo gradient card + dense inline layouts.

After:
- Soft dotted ambient background beneath the page.
- Redesigned hero band (`DashboardHeader`) with:
  - Greeting by time-of-day, teacher name with degree, institution + academic year meta line.
  - Real-time clock module using JetBrains Mono numerals with WIB tag and localized weekday line.
  - Subtle grid overlay + inner glow to add depth without noise.
- Error banner (auth surface) restyled with `role="alert"`, dismiss button, semantic destructive tokens.
- Children (`ScheduleTabs`, `IncompleteSchedules`) preserved.

## Metric cards (`StatsCard`)

- Restyled with token-driven layered surfaces + tabular numerals on the value.
- Iconic accent square upgraded to a tinted primary-subtle tile with subtle hover-scale.
- Optional `trend` badge added (green +% for gains, red −% for losses).
- Hover reveals an accent underline for scanning affordance.

## Loading state (`LoadingComponent`)

- Replaced the raw border-spin with a layered ring: rotating conic-gradient arc + surface core + soft-pulsing primary dot.
- Adds `role="status"` + `aria-live="polite"` + secondary caption.

## Error state (`ErrorComponent`)

- Card-elevated presentation with iconified destructive tile, semantic tokens, and an explicit retry button.
- `role="alert"` + `aria-live="assertive"` for immediate SR announcement.

## 404 & 403

- Elevated card with ambient glow, semantic status color (indigo for 404, warning amber for 403).
- Iconified 403 with `ShieldExclamationIcon`.
- Refined primary + secondary CTAs on 404 (Home + Back).

## Global error

- Elevated card with ISO-styled digest reference and clear retry action.
- Inline styles mirror design tokens to remain themeable-looking without depending on runtime CSS variables (Next.js global-error boundary limitation).

## Third-party integrations

- `react-big-calendar` — themed via `globals.css`: today shading uses `primary-subtle`, events use `primary`, toolbar buttons adopt tokenized outlines.
- `Leaflet` — container background tokenized; dark mode softens tile brightness.
- `react-hot-toast` — restyled with tokenized surface/border/shadow.

## What did **not** change visually

- Individual admin/teacher CRUD screens (classroom, schedules, teachers, reports, profile) — visuals inherit the palette remap but their layouts remain identical to v1 until per-page migrations land.
- Attendance capture flow (camera + geolocation) — unchanged.
- Report PDF download surface — unchanged.
- Modal contents (student, teacher, upgrade, absensi, subject) — unchanged.
