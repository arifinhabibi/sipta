# Component Migration Log

Tracks every component rebuilt or created for SIPTA v2 alongside compatibility notes.

---

## New components

| Component | Path | Purpose |
| --- | --- | --- |
| `ThemeProvider` | `app/components/ThemeProvider.tsx` | React context managing `theme` (`"light" \| "dark"`) with localStorage persistence (`sipta-theme`) and system-preference fallback. Applies `.dark` class + `data-theme` attribute to `<html>`. |
| `ThemeToggle` | `app/components/ThemeToggle.tsx` | Accessible icon button consumed by `HeaderComponent`. Data-testid `theme-toggle`, aria-label + aria-pressed. |

## Redesigned components (same API contract)

| Old component | New component | Contract preserved | Redesign notes |
| --- | --- | --- | --- |
| `LoadingComponent` | `LoadingComponent` (v2) | Same default export, no props; renders full-screen loading state. | Refined layered ring spinner using tokens; adds `role="status"`, `aria-live="polite"`, `data-testid="loading-component"`. |
| `ErrorComponent` | `ErrorComponent` (v2) | Same `{ setError, error }` props; still calls `setError(null)` to retry. | Iconified error card with semantic tokens; adds `role="alert"`, `data-testid="error-component"` + `error-retry-button`. |
| `StatsCard` | `StatsCard` (v2) | Same 5 props: `icon`, `label`, `value`, `color`, `subtitle`. Every existing call site works unchanged. | Adds optional `trend` (number) + `testId` prop; upgraded to display font + tabular numerals; hover accent line. |
| `HeaderComponent` | `HeaderComponent` (v2) | Identical nav destinations (`/`, `/teachers`, `/classroom`, `/schedules`, `/reports`, `/profile`), identical role gating (`admin` only for `/teachers`), identical logout flow (uses `useAuthStore().logout`, toasts, `router.push('/auth/login')`), identical localStorage read for cached identity. | Replaces full-width blue gradient with subtle sticky top bar; adds `ThemeToggle`; splits mobile nav into a hamburger drawer; upgrades profile menu to avatar-initials popover; adds visible focus rings + `data-testid`s on every interactive element. |
| `DashboardHeader` | `DashboardHeader` (v2) | Same real-time clock, same localStorage data source (`auth-storage`), same shown fields (name, degree, school, academic year, time). | Restyled hero band: subtle grid + inner glow, dedicated clock module with monospace numerals, WIB tag, greeting by time-of-day. |
| `not-found.tsx` | `not-found.tsx` (v2) | Same `Link` to `/`. | Redesigned as an elevated card with ambient glow + secondary action; retains `HomeIcon`. |
| `403/page.tsx` | `403/page.tsx` (v2) | Same `Link` to `/`. | Redesigned with `ShieldExclamationIcon`; token-driven warning color. |
| `global-error.tsx` | `global-error.tsx` (v2) | Same `reset()` callback surface, same digest display, same `<html><body>` shell required by Next.js. | Uses inline styles (design tokens unavailable inside `global-error`); mirrors token values manually to remain themeable-looking without runtime deps. |
| `page.tsx` (Dashboard) | `page.tsx` (v2) | Same `ProtectedRoute allowedRoles=["teacher","admin"]`, same three sub-components (`DashboardHeader`, `ScheduleTabs`, `IncompleteSchedules`), same auth-error surfacing. | Softer dotted canvas; semantic error banner with dismiss button; retained root-level guard. |
| `auth/login/page.tsx` | `login/page.tsx` (v2) | Same React Hook Form validation (`username` regex + min-length, `password` min-length, register-only pattern), same `useAuthStore().login` invocation, same permission probes (geolocation + camera), same toast semantics, same post-login redirect via `useEffect`. | Split-layout with branded pane + form pane; refined field affordances (icon-prefixed inputs), aria-invalid + aria-describedby, password reveal button retained. |

## Renamed / rewritten but transparent

None. All components keep their original file paths and default exports.

## Components _untouched_ (visual redesign inherited via token remap)

- `app/components/ProtectedRoute.tsx` — auth guard behavior fully preserved.
- `app/components/FooterComponent.tsx` — file is empty in v1 and remains so.
- All `app/components/classrooms/*` (11 files).
- All `app/components/schedules/*` (6 files).
- All `app/components/reports/*` (17 files including teacher and student sub-trees).
- All `app/components/dashboard/*` besides `DashboardHeader.tsx` (5 files).
- All `app/components/teachers/*` (3 files).
- All `app/components/profiles/*` (6 files).
- Every route file under `/classroom`, `/schedules`, `/reports`, `/teachers`, `/profile`.

These files continue to use raw Tailwind utility classes (`bg-white`, `bg-blue-600`, `text-gray-500`, etc.). Because `app/globals.css` remaps the Tailwind color palette (see `design-system.md §11`), they render in the new fintech aesthetic without any code change and adapt to dark mode automatically for the neutral scale.

## Removed duplication

- Full-width `bg-gradient-to-r from-blue-600 to-indigo-700` header pattern (previously repeated in `HeaderComponent`) — replaced by a single hairline sticky top-bar with proper elevation semantics.
- Multiple ad-hoc loading spinners have a canonical implementation now (`LoadingComponent` v2) reachable via the same import path.
- Multiple ad-hoc error panels have a canonical implementation now (`ErrorComponent` v2) reachable via the same import path.

## Known compatibility risks

| Risk | Mitigation |
| --- | --- |
| Existing pages that read colors from Tailwind semantics that shifted (e.g. `bg-emerald-*` now means "success", not a decorative green). | Every remap keeps semantic intent aligned with idiomatic usage; verified visually across dashboard, login, 403, 404, header, profile menu. |
| `bg-white` in dark mode remains literal white. | Documented in `design-system.md §11`; large cards in unmigrated pages appear as light content on dark canvas — an intentional design pattern until per-file migration lands. |
| Icon-only buttons must expose `aria-label` — new components comply; legacy icon buttons (e.g. inside classroom/reports modals) may still miss labels. | Backlog item; not a redesign regression. |
