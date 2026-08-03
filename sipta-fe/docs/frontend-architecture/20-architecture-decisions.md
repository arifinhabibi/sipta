# 20. Architecture Decisions

These ADR-style records describe the repository as implemented. “Accepted” means current reality, not necessarily an ideal future choice.

## ADR-001 — Next.js App Router

- **Status:** Accepted.
- **Context:** The application needs file-based public, protected, and dynamic screens.
- **Decision:** Routes live under root `app/`; dynamic segments use bracket folders.
- **Evidence:** `app/layout.tsx`, `app/**/page.tsx`, `next` version in `package.json`.
- **Consequences:** Route discovery is conventional, but there are no nested layouts or segment loading/error boundaries.
- **Alternative:** Pages Router was not found.
- **Redesign implication:** Preserve route paths and root provider nesting.

## ADR-002 — Client-heavy feature rendering

- **Status:** Accepted, with debt.
- **Context:** Screens use browser storage, Zustand, browser APIs, effects, and interactive modals.
- **Decision:** Most feature pages/components are client components.
- **Evidence:** `"use client"` across `app/` pages and components.
- **Consequences:** Interactivity is direct, but bundles and presentation/business coupling grow.
- **Alternative:** Server components plus smaller client islands.
- **Redesign implication:** Do not remove client boundaries until dependencies are isolated and tested.

## ADR-003 — Zustand global state

- **Status:** Accepted.
- **Decision:** Auth and feature orchestration use stores under `src/state/`; auth is persisted.
- **Evidence:** `src/state/*Store.ts`, `zustand` dependency.
- **Consequences:** Simple shared actions, but server data, global state, and API orchestration are mixed and uncached.
- **Alternative:** Context or a server-state cache were not implemented.
- **Redesign implication:** Reuse existing stores; do not introduce duplicate ownership.

## ADR-004 — Central Axios client with refresh interceptor

- **Status:** Accepted; security-sensitive.
- **Decision:** API modules share `src/infrastructure/Instance.ts`; `SetupInterceptor.ts` handles transient retries and 401 refresh.
- **Consequences:** Uniform base client and refresh, with coupling to AuthStore initialization.
- **Alternative:** fetch/server actions or cookie-only server sessions were not implemented.
- **Redesign implication:** Presentation work must not rewrite this lifecycle.

## ADR-005 — Browser-persisted authentication

- **Status:** Accepted current implementation; review recommended.
- **Decision:** Zustand persists token, refresh token, expiry, user, instance, and academic year under `auth-storage`.
- **Evidence:** `src/state/AuthStore.ts`.
- **Consequences:** Reload restoration is straightforward; browser-readable tokens increase XSS exposure and client protection occurs after hydration.
- **Alternative:** HttpOnly backend-managed sessions would require coordinated backend changes.
- **Redesign implication:** Preserve the contract now; handle any replacement as a security migration.

## ADR-006 — Tailwind v4 plus HeroUI

- **Status:** Accepted.
- **Decision:** Tailwind utilities/global CSS and HeroUI components/provider form the UI layer; Heroicons supply icons.
- **Evidence:** `app/globals.css`, `postcss.config.mjs`, `app/providers.tsx`, `package.json`.
- **Consequences:** Rapid local styling, but semantic tokens and consistency are limited.
- **Alternative:** A single custom component system has not been implemented.
- **Redesign implication:** Introduce semantic tokens and migrate primitives incrementally.

## ADR-007 — Split root `app/` and `src/` organization

- **Status:** Accepted current structure.
- **Decision:** Routes/components are primarily in `app/`; domain, infrastructure, and stores are in `src/`.
- **Evidence:** repository tree and `@/*` root alias in `tsconfig.json`.
- **Consequences:** Some layer separation exists, while feature ownership crosses directories.
- **Alternative:** Full `src/app` or feature-sliced structure was not chosen.
- **Redesign implication:** Do not combine UI redesign with a mass file move.

## ADR-008 — Canonical term-aware student reports

- **Status:** Partially implemented / migration in progress.
- **Context:** Users need historical reports without switching the operational active semester.
- **Decision:** New readers should use canonical `performance-students` methods with `academic_year_id`; legacy misspelled endpoints remain for existing behavior.
- **Evidence:** both method families in `src/infrastructure/ReportApi.ts`.
- **Consequences:** Historical reads are possible at API-client level, but the current UI lacks a semester selector and remains inconsistent.
- **Alternative:** Reactivating old semesters would corrupt operational context and is rejected.
- **Redesign implication:** Follow `21-semester-student-report.md`; closed terms are read-only.
