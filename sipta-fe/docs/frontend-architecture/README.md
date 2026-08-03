# SIPTA Frontend Architecture

This directory is the authoritative onboarding package for AI agents and humans
who will redesign or extend the SIPTA frontend. It describes the repository as
it exists; it does not propose a replacement application.

## Snapshot

- **Framework:** Next.js 15.5.4 App Router, React 19.1, TypeScript strict.
- **Runtime style:** client-heavy SPA behavior inside App Router pages.
- **State:** Zustand stores; auth is persisted to browser `localStorage`.
- **API:** one Axios instance and a response interceptor under
  `src/infrastructure/`.
- **UI:** Tailwind CSS v4, HeroUI provider, Heroicons, handwritten components.
- **Primary roles:** `admin` and `teacher`.
- **Maturity:** functional but transitional. Core workflows exist; boundaries,
  typing, tests, and design consistency are incomplete.

## Evidence labels

- **Verified:** directly observed in the repository.
- **Inferred:** likely behavior based on several files; validate at runtime.
- **Missing:** referenced or required behavior not implemented in the frontend.
- **Recommendation:** future work, not current behavior.

## Navigation

| Area | Document |
| --- | --- |
| Context and structure | [01](01-system-overview.md), [02](02-repository-structure.md) |
| Routes, pages, layouts, components | [03](03-routing-and-navigation.md), [04](04-page-inventory.md), [05](05-layout-architecture.md), [06](06-component-architecture.md) |
| Design, state, API, auth | [07](07-design-system.md), [08](08-state-management.md), [09](09-data-fetching-and-api.md), [10](10-authentication-and-authorization.md) |
| Forms and user feedback | [11](11-forms-and-validation.md), [12](12-error-loading-and-feedback.md), [13](13-responsive-and-accessibility.md) |
| Configuration and integrations | [14](14-environment-and-configuration.md), [15](15-external-integrations.md) |
| Quality and debt | [16](16-testing-and-quality.md), [17](17-technical-debt.md) |
| Redesign execution | [18](18-emergent-redesign-guide.md), [19](19-redesign-checklist.md), [20](20-architecture-decisions.md) |
| Traceability and boundaries | [page matrix](page-component-matrix.md), [business boundaries](business-logic-boundaries.md) |
| Required report enhancement | [student reports by semester](21-semester-student-report.md) |
| Machine-readable inventory | [frontend-manifest.json](frontend-manifest.json) |

## Major risks

1. `app/components/ProtectedRoute.tsx`, `src/state/AuthStore.ts`, and
   `src/infrastructure/SetupInterceptor.ts` jointly implement security-sensitive
   client behavior.
2. `app/reports/page.tsx` and student report screens mix legacy
   `/perfomance-students` responses with canonical `/performance-students`
   endpoints. Do not silently swap response shapes.
3. `app/reports/page.tsx` creates mock calendar data and several methods in
   `src/infrastructure/ReportApi.ts` are empty. These are incomplete features,
   not approved sources of production truth.
4. Page/component files above 500 lines mix data access, permissions, forms,
   transformations, and presentation.
5. No frontend test files or test scripts were found. `npm run build` is the
   strongest current automated regression check.

## AI working rules

- Preserve routes, API field names, UUIDs, role checks, storage keys, and form
  payloads unless a separately approved contract migration says otherwise.
- Never replace API calls with mock data. Remove existing mock behavior only as
  a deliberate feature fix with real API coverage.
- Do not reactivate closed semesters to show history. Historical reports are
  read-only and selected by `academic_year_id`.
- Keep current business calculations on the backend. The frontend displays
  scores and recommendations; it must not invent new promotion formulas.
- Avoid broad rewrites of auth, interceptors, attendance capture, uploads, or
  promotion workflows during visual redesign.
- Run `npm run build` after each migration slice. Record the existing Biome
  baseline separately from newly introduced errors.

## Safe redesign boundary

Colors, typography, spacing, visual hierarchy, responsive composition, icons,
cards, tables, dialogs, skeleton visuals, and navigation styling are generally
safe when handler props and accessibility semantics remain intact. Protected
behavior is enumerated in [business-logic-boundaries.md](business-logic-boundaries.md).

