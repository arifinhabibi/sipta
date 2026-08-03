# SIPTA — Frontend Redesign PRD

## Problem statement (original)

Perform a **complete UI/UX redesign** of the existing `sipta-fe` Next.js 15.5 frontend (App Router, React 19, TypeScript strict, Tailwind v4, HeroUI, Zustand) while strictly preserving all verified application behavior — routes, API contracts, authentication/authorization, forms, validation, business logic, and external integrations. Delivered from the existing repository (arifinhabibi/sipta), not a greenfield rebuild.

## Users

- **Admin** — teacher, classroom, subject, schedule, academic-year, student, and promotion administration.
- **Teacher (Guru)** — daily schedule, classroom participation, attendance, assessment, profile, and report consumption.

## Core requirements (static)

- Modern fintech / analytics aesthetic.
- Light + dark themes with toggle (system-pref detection).
- Distinctive non-generic typography.
- Full visual overhaul of tokens + primitives + all pages (as requested by user).
- Preserve routes, API integration, auth, forms, business logic, storage keys, uploads, promotion, attendance draft key `draft-{schedule_id}`, and academic-year workflows.

## Architecture tasks

- Introduced a semantic token layer (`app/globals.css`) with light + dark values.
- Remapped Tailwind v4 built-in palette to CSS-var-driven tokens so ~80 legacy files inherit the new aesthetic and become theme-aware.
- Wired 3 new fonts via `next/font/google` (Bricolage Grotesque, JetBrains Mono; kept Geist).
- Added a `ThemeProvider` React context + `ThemeToggle` UI + no-FOUC bootstrap script.
- Redesigned the app shell (`HeaderComponent`), dashboard hero (`DashboardHeader`), primitives (`StatsCard`, `LoadingComponent`, `ErrorComponent`), auth surface (`/auth/login`), and error routes (`/403`, `not-found`, `global-error`).

## What's been implemented (2026-01)

- ✅ Complete semantic token system with dual-theme support (`globals.css`).
- ✅ Palette remap covering blue/indigo/emerald/red/yellow/gray/slate/purple/violet/cyan/sky scales.
- ✅ Typography stack: Bricolage Grotesque (display) + Geist (body) + JetBrains Mono (tabular).
- ✅ Dark mode: inline no-FOUC bootstrap, `ThemeProvider`, `ThemeToggle`, localStorage `sipta-theme` persistence.
- ✅ Redesigned shells: `HeaderComponent` (sticky hairline top-bar, mobile drawer, theme toggle, logout modal), `DashboardHeader` (branded hero band with clock).
- ✅ Redesigned primitives: `LoadingComponent`, `ErrorComponent`, `StatsCard`, `NotFound`, `Forbidden`, `GlobalError`.
- ✅ Redesigned `/auth/login`: split-layout, icon-affordanced inputs, full a11y semantics, permanently-branded gradient pane pinned to legible white.
- ✅ Third-party skin: react-big-calendar, Leaflet, react-hot-toast — all tokenized.
- ✅ Documentation deliverables under `docs/frontend-redesign/`: `README.md`, `design-system.md`, `component-migration.md`, `page-redesign-status.md`, `regression-report.md`, `visual-changelog.md`.
- ✅ `next build` passes (all 12 routes generated).
- ✅ Every existing route, API client, store, form, and auth path preserved verbatim.

## Prioritized backlog

### P0 (correctness)
- None. Build passes; contracts preserved.

### P1 (finish-line polish)
- Per-page migration of hardcoded `bg-white`/`text-gray-*` patterns in `/classroom`, `/schedules`, `/reports`, `/teachers`, `/profile` to semantic tokens for perfect dark-mode fidelity.
- Extract shared primitives (`Button`, `Input`, `Card`, `Modal`, `Table`, `Badge`, `EmptyState`, `Skeleton`) into `app/components/ui/*`.

### P2 (feature)
- Implement the semester-history report UI per `docs/frontend-architecture/21-semester-student-report.md`.
- Introduce Playwright smoke tests for auth + attendance + report flows.
- Address pre-existing Biome baseline (553 errors / 565 warnings) in unmodified files.

## Test credentials

- Backend & real credentials are **not** owned by this task. Auth flow was verified via a stubbed localStorage session for the dashboard visual test (see `regression-report.md §7`). See `test_credentials.md` if seed credentials become available.

## Files changed (11) / added (7)

- Modified: `app/globals.css`, `app/layout.tsx`, `app/providers.tsx`, `app/page.tsx`, `app/auth/login/page.tsx`, `app/components/HeaderComponent.tsx`, `app/components/dashboard/DashboardHeader.tsx`, `app/components/StatsCard.tsx`, `app/components/LoadingComponent.tsx`, `app/components/ErrorComponent.tsx`, `app/not-found.tsx`, `app/403/page.tsx`, `app/global-error.tsx`.
- Added: `app/components/ThemeProvider.tsx`, `app/components/ThemeToggle.tsx`, `docs/frontend-redesign/README.md`, `docs/frontend-redesign/design-system.md`, `docs/frontend-redesign/component-migration.md`, `docs/frontend-redesign/page-redesign-status.md`, `docs/frontend-redesign/regression-report.md`, `docs/frontend-redesign/visual-changelog.md`.

## Untouched (high-risk / preservation contract)

All of `src/**` (auth, interceptors, API clients, stores, domain), `app/components/ProtectedRoute.tsx`, and every business-critical page (`/classroom/**`, `/schedules`, `/reports`, `/teachers`, `/profile`) plus all modal components under `app/components/classrooms/**`, `schedules/**`, `reports/**`, `dashboard/**`, `teachers/**`, `profiles/**`.
