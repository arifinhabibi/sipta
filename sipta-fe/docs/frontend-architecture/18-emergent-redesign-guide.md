# 18. Emergent Redesign Guide

## Objective

Change presentation safely while treating current routes, API behavior, authorization, state transitions, identifiers, storage keys, uploads, and academic workflows as compatibility contracts.

## Safe to change

- semantic colors, typography, spacing, radius, shadows, and visual hierarchy after establishing tokens;
- responsive composition of headers, cards, forms, tables, filters, and detail panels;
- presentational extraction from large components while preserving inputs/callbacks;
- icons and labels when action meaning and accessible names remain equivalent;
- loading, empty, error, and success visuals without altering triggering conditions;
- navigation styling and grouping while retaining exact route destinations and role visibility;
- closed-semester report presentation, including an explicit read-only banner.

## Must preserve

- route paths and dynamic parameter names listed in `03-routing-and-navigation.md`;
- `NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_ASSET` configuration semantics;
- API HTTP methods, endpoint spelling, payload keys, response fields, blob handling, and multipart construction until explicitly migrated;
- auth persistence key `auth-storage`, bearer/refresh lifecycle, role checks, `/auth/login` and `/403` redirects;
- attendance draft key pattern `draft-{schedule_id}`;
- database/API identifiers such as student, classroom, schedule, and `academic_year_id` UUIDs;
- academic-year close/rollover/transition and promotion behavior;
- camera/geolocation attendance submission logic;
- date/time and attendance status semantics;
- active-term assessment edit behavior and historical-term read-only behavior.

## High-risk files

| File | Risk |
| --- | --- |
| `src/infrastructure/Instance.ts` | base client, credentials, token header |
| `src/infrastructure/SetupInterceptor.ts` | retry and refresh behavior |
| `src/state/AuthStore.ts` | persisted session, refresh, initialize, logout |
| `app/providers.tsx` | auth/interceptor initialization order |
| `app/components/ProtectedRoute.tsx` | authentication/role redirects |
| `src/infrastructure/ReportApi.ts` | conflicting legacy/canonical report contracts |
| `src/infrastructure/AcademicYearApi.ts` and `src/state/AcademicYearStore.ts` | academic workflow transitions |
| `app/components/classrooms/UpgradeStudentModal.tsx` | promotion workflow |
| `app/components/dashboard/AbsensiModal.tsx` | camera/location attendance payload |
| `app/classroom/schedule/[schedule_id]/page.tsx` | student attendance and persisted draft |
| `app/components/reports/students/StudentTab.tsx` | report orchestration and mixed concerns |
| `app/components/reports/students/StudentDetailModal.tsx` | assessment edit and report display logic |

## Recommended redesign order

1. Capture API/auth/business regression cases.
2. Introduce semantic design tokens without changing component behavior.
3. Build accessible UI primitives compatible with HeroUI/Tailwind.
4. Migrate root layout, feedback shell, and header/navigation.
5. Migrate lower-risk profile and list presentation.
6. Migrate authenticated CRUD forms with payload regression checks.
7. Split and migrate classroom, schedule, attendance, and report pages.
8. Add the semester-history report UI using `21-semester-student-report.md`.
9. Verify responsive layouts and accessibility.
10. Run API, auth, form, lint, and build regression gates.

## Working rules for another AI agent

- Do not replace real API data with mock/random data.
- Do not remove or rename routes, request fields, response fields, identifiers, roles, or storage keys.
- Do not rewrite authentication or retry logic as part of styling.
- Do not reactivate a closed semester to display history.
- Do not make a historical report editable.
- Do not introduce a second state library or UI library without a migration decision.
- Do not convert components between server and client boundaries without checking browser APIs, stores, and hooks.
- Do not modify backend code from a frontend redesign task.
- Keep commits/phases small enough to compare behavior.
- Run the available quality checks after every major phase and report baseline failures honestly.
