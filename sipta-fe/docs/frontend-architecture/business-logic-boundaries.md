# Frontend Business-Logic Boundaries

## Pure presentation or low-risk presentation

| Files | Logic | Safe changes | Preserve/extract? |
| --- | --- | --- | --- |
| `app/403/page.tsx`, `app/not-found.tsx` | static navigation/message | layout, typography, illustration | preserve destinations |
| loading components under `app/components/**/Loading*` and `ScheduleSkeleton.tsx` | loading visuals | full visual replacement | preserve when they render |
| cards/tables that only receive data and callbacks | formatting and event delegation | markup/responsive styling | keep callback/ID semantics |

Verify individual files before classification: several apparently presentational components also open modals or transform domain values.

## Presentation with minor logic

| Files | Logic that matters | Safe changes | Must remain |
| --- | --- | --- | --- |
| `app/components/HeaderComponent.tsx` and header implementation | route selection, mobile navigation, user display | visual composition | routes, role visibility, logout trigger |
| `app/components/classrooms/ClassroomTable.tsx`, `ClassroomCard.tsx` | selection/action routing | table/card visuals | entity IDs and callbacks |
| report teacher filter/export modals | dates, download triggers | form/modal visuals | date format, blob trigger, API arguments |
| profile display sections | local editing/display modes | section composition | store/API callbacks and privilege checks |

## Business-critical frontend logic

| File | Logic | What may change | What must not change | Extraction direction |
| --- | --- | --- | --- | --- |
| `app/components/classrooms/UpgradeStudentModal.tsx` | selected students, target classrooms, promotion payload | presentation and selection widgets | eligibility/context, IDs, confirmation, payload | extract promotion view model after tests |
| `app/classroom/schedule/[schedule_id]/page.tsx` | attendance status, draft restore/save/submit | table/control visuals | `draft-{schedule_id}`, statuses, payload and completion flow | attendance hook/service |
| `app/components/dashboard/AbsensiModal.tsx` | camera capture, geolocation and attendance submission | permission UI/camera framing | captured data and multipart contract | browser capability hook + payload adapter |
| `app/components/dashboard/AccomplishModal.tsx` | accomplishment payload | editor visuals | schedule association and submitted values | typed form adapter |
| `app/components/reports/students/StudentTab.tsx` | report fetching/filtering/transformation/navigation | report layout | authoritative response fields and IDs | container + pure views |
| `app/components/reports/students/StudentDetailModal.tsx` | assessment values and update | dialog/report visuals | active-term edit rules and update payload | separate read view/editor |
| `app/reports/students/[student_id]/page.tsx` | report/download orchestration | page layout | student ID, API selection, blob lifecycle | term-aware report container |
| `src/state/AcademicYearStore.ts` | activate versus sequential transition, persisted active context, reload | error wording only with care | transition choice, target ID, auth update | tested application service |
| `src/stifin*` | domain mapping/labels | visual placement | mapping output/meaning | keep as domain utility |

## Infrastructure

| Files | Responsibility | Change boundary |
| --- | --- | --- |
| `src/infrastructure/Instance.ts` | Axios base client and token header | no visual-task changes |
| `src/infrastructure/SetupInterceptor.ts` | retry and refresh request lifecycle | security/API change only with tests |
| `src/infrastructure/*Api.ts` | endpoint, query, payload, blob/multipart contracts | add typed/canonical methods only from verified backend routes |
| `src/state/*Store.ts` | API orchestration, shared loading/data/errors | selectors may be added; preserve action behavior |
| `src/domain/*Entity.ts` | DTO/domain contracts | reconcile duplicates in a dedicated typed migration |

## Security-sensitive logic

| File | Why sensitive | Preserve |
| --- | --- | --- |
| `src/state/AuthStore.ts` | token persistence, initialization, refresh, logout | `auth-storage` compatibility and session lifecycle |
| `app/providers.tsx` | initialization order | provider nesting and interceptor setup timing |
| `app/components/ProtectedRoute.tsx` | authentication and role redirects | access decisions and destinations |
| `src/utils/LocalStorageAuth.ts` | persisted auth/academic-year access | storage shape/key compatibility |

## Backend-authoritative decisions

The frontend must not independently decide authentication validity, authorization, academic-year closure, placement continuity, promotion eligibility/result, attendance validity, assessment completeness, rank, or report truth. It may render backend decisions and prevent obviously invalid UI actions. Historical reporting must pass `academic_year_id` and render the returned historical placement; switching the application's active semester is not a read operation.

## Refactoring rule

First freeze observable behavior with tests or recorded request/response fixtures. Then extract pure presentation from containers without renaming fields. Only after parity should business logic move into typed hooks/services. Do not combine endpoint migration, state-library migration, file relocation, and visual redesign in one change.
