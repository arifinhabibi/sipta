# SIPTA Frontend — v2 Redesign

_A production-grade UI/UX modernization of the existing SIPTA Next.js frontend, delivered as a **presentation-layer overhaul** with **zero changes to routes, API contracts, auth, forms, state management, or business logic**._

---

## 1. Redesign summary

SIPTA v1 shipped a functional teacher/admin portal with hardcoded Tailwind utility colors, loud blue→indigo gradients, and mixed presentational patterns. v2 transforms the visual language into a **modern fintech / analytics** aesthetic while preserving every documented working behavior.

- **Design direction:** structured, calm, data-first — inspired by Linear, Stripe, and Mercury; refined without ornament.
- **Palette:** sophisticated indigo primary (`#4F46E5`) + violet accent + warm stone neutrals + full semantic status set.
- **Typography:** distinctive, non-generic pairing — **Bricolage Grotesque** (display) / **Geist Sans** (body/UI) / **JetBrains Mono** (tabular numbers).
- **Themes:** full **light + dark mode** with system-preference detection, localStorage persistence, and no-FOUC bootstrap.

## 2. Design direction

| Pillar | Approach |
| --- | --- |
| Hierarchy | Clear headings via display font; ordered elevation via 4-layer surface system (`background → surface → surface-2/3 → surface-elevated`). |
| Restraint | One dominant accent (indigo); status colors used only for meaning; gradients reserved for branded hero surfaces. |
| Density | Data-first cards, tabular numerals for stats, refined spacing, tighter but legible line-heights. |
| Motion | Micro-fades and hover shifts only; respects `prefers-reduced-motion`. |
| Accessibility | Semantic tokens, visible 2 px focus rings, ARIA on menus/dialogs, targeted labels, alt/aria-hidden on icons. |

## 3. Major improvements

1. **Semantic token layer** in `app/globals.css` replaces two ad-hoc CSS variables with a full design system: surfaces (4 layers), foreground scale, borders, primary/success/warning/destructive/info sets, radii, shadows, motion tokens.
2. **Tailwind v4 palette remap** — the built-in `blue-*`, `indigo-*`, `emerald-*`, `red-*`, `yellow-*`, `gray-*`, `purple-*`, `cyan-*`, `sky-*` scales all resolve through CSS variables that switch on `.dark`. As a result the **existing ~80 hardcoded utility usages across the codebase automatically inherit the redesign and become theme-aware** without touching each file.
3. **Distinctive typography stack** — display face variable-wired at the token layer; monospace surfaces adopt tabular figures automatically.
4. **Dark mode** — inline no-FOUC bootstrap in `<head>` before hydration; `ThemeProvider` context; `ThemeToggle` icon button wired into the redesigned header; user preference persisted under `sipta-theme` (separate from `auth-storage`).
5. **Redesigned shell** — `HeaderComponent` replaces the loud full-width blue gradient with a sticky hairline top bar, refined desktop nav with underline active state, dedicated mobile drawer, avatar-initials profile dropdown, and confirmation dialog for logout.
6. **Redesigned primitives** — `StatsCard`, `LoadingComponent`, `ErrorComponent`, `NotFound`, `Forbidden`, `GlobalError` — all rebuilt on semantic tokens with accessible role/aria semantics and data-testids.
7. **Redesigned hero pages** — `Dashboard` shell with dotted ambient canvas and semantic error banner; `Login` split-layout with branded pane, refined form controls, icon-affordanced inputs, aria-invalid + aria-describedby, and a permanently-branded gradient pane that remains legible in both modes.

## 4. Implementation scope

**Files created (7):**

- `app/components/ThemeProvider.tsx` — theme context + persistence.
- `app/components/ThemeToggle.tsx` — accessible icon toggle.
- `docs/frontend-redesign/README.md` — this file.
- `docs/frontend-redesign/design-system.md`
- `docs/frontend-redesign/component-migration.md`
- `docs/frontend-redesign/page-redesign-status.md`
- `docs/frontend-redesign/regression-report.md`
- `docs/frontend-redesign/visual-changelog.md`

**Files modified (11):**

- `app/globals.css` — complete rewrite: semantic tokens, Tailwind v4 palette remap, third-party overrides, keyframes, utilities.
- `app/layout.tsx` — new fonts (Bricolage, JetBrains Mono) alongside Geist; no-FOUC theme bootstrap; theme-aware Toaster styling; refined `<title>`/description.
- `app/providers.tsx` — wraps existing HeroUI + AuthInitializer in `ThemeProvider` (behavior of both preserved).
- `app/page.tsx` (Dashboard) — refined shell/canvas + semantic error banner; preserved auth guard + role gating + child components.
- `app/auth/login/page.tsx` — split-layout redesign; identical form fields, validation rules, submission handler, permission probes, redirect logic.
- `app/components/HeaderComponent.tsx` — modernized shell with theme toggle & mobile drawer; identical nav destinations, role gating, logout flow.
- `app/components/dashboard/DashboardHeader.tsx` — refined hero band; identical data sources (localStorage `auth-storage`) & real-time clock.
- `app/components/StatsCard.tsx` — semantic tokens, tabular figures; preserved 5-prop signature; optional `trend`/`testId` added.
- `app/components/LoadingComponent.tsx` — refined spinner on tokens.
- `app/components/ErrorComponent.tsx` — semantic error state with retry.
- `app/not-found.tsx`, `app/403/page.tsx`, `app/global-error.tsx` — redesigned error surfaces.

**Files _intentionally_ untouched (high-risk / architecture-guarded):**

- `src/state/AuthStore.ts`, `src/infrastructure/SetupInterceptor.ts`, `src/infrastructure/Instance.ts`, all of `src/infrastructure/*`, all of `src/domain/*`, all of `src/state/*`.
- `app/components/ProtectedRoute.tsx` (auth guard).
- Business-critical page bodies: `app/classroom/**`, `app/schedules/**`, `app/reports/**`, `app/teachers/**`, `app/profile/**`, `app/classroom/schedule/[schedule_id]/page.tsx` (attendance capture with localStorage draft), `app/reports/students/[student_id]/page.tsx`, all `app/components/classrooms/**`, `app/components/schedules/**`, `app/components/reports/**`, `app/components/dashboard/AbsensiModal.tsx`, `app/components/classrooms/UpgradeStudentModal.tsx`.

Those pages/components **inherit the redesign automatically** via the Tailwind palette remap (fintech indigo primary, refined neutrals, dark-mode aware) without any code change, per the redesign contract.

## 5. Preserved behaviors

- Every route path (`/`, `/auth/login`, `/teachers`, `/classroom`, `/classroom/schedule/[schedule_id]`, `/classroom/history/[schedule_id]`, `/classroom/student/[student_id]`, `/schedules`, `/reports`, `/reports/students/[student_id]`, `/profile`, `/403`, `not-found`).
- `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_ASSET` env semantics.
- Auth storage key `auth-storage`, refresh lifecycle, `initializeAuth` ordering, `checkTokenValidity`, `refreshAuthToken`, `logout` and `clearAuth` side-effects.
- Attendance draft key pattern `draft-{schedule_id}`.
- Axios base client, headers, interceptors, and multipart/blob semantics.
- All React Hook Form field names, validation rules, submission handlers, and payloads.
- Role gating (`admin` vs `teacher`) at both route-guard and nav-visibility levels.
- Academic-year workflow, promotion, and attendance handlers untouched.

## 6. Unresolved limitations

- **Legacy pages retain hardcoded utility classes** (`bg-white`, `bg-blue-600`, `text-gray-500`, etc.). The palette remap makes them theme-aware, but a few specific gradient-header patterns (`from-blue-600 to-indigo-700` with `text-white`) will show `text-white` remaining literal white on now-indigo primary — which is correct — but any `bg-white` card in dark mode remains white (see design-system.md §6 for the rationale). Wholesale per-file migration is deliberately deferred; the docs-preservation contract forbids broad rewrites of business-critical files during a visual redesign.
- **Register mode UI** on the login screen is intentionally hidden (the v1 code exposed a toggle without an active flow); state and validation retained.
- **No unit/e2e tests exist** in the repo (per `docs/frontend-architecture/16-testing-and-quality.md`); `next build` is the strongest regression gate available and it **passes** post-redesign.
- **Biome lint** — pre-existing baseline warnings in the untouched legacy files remain unchanged (documented in `regression-report.md`); no new violations introduced by redesign files.

## 7. How to run

```bash
cd sipta-fe
npm install --legacy-peer-deps
npm run dev         # http://localhost:3000
npm run build       # production build
npm run lint        # biome check
```

## 8. Next steps (backlog)

1. Incremental per-page presentation refactors: `/classroom`, `/schedules`, `/reports`, `/teachers`, `/profile` — replace hardcoded `bg-white`/`text-gray-*` patterns with semantic `bg-surface`/`text-foreground` utilities for perfect dark-mode fidelity.
2. Extract shared primitives (Button, Input, Card, Modal, Table, Badge, EmptyState, Skeleton) into `app/components/ui/*` — the token layer is ready.
3. Implement the semester-history report UI per `docs/frontend-architecture/21-semester-student-report.md`.
4. Introduce Playwright smoke tests to protect the auth + attendance + report flows during future refactors.
