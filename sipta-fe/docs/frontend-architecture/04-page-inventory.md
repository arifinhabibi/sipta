# 04. Page Inventory

## Dashboard (`/`)

- Source: `app/page.tsx`.
- Components: `HeaderComponent`, `DashboardHeader`, `ScheduleTabs`,
  `IncompleteSchedules`, `ErrorComponent`, `LoadingComponent`.
- Preserved behavior: role access, schedule attendance/accomplishment actions.
- Redesign opportunity: compose a clearer dashboard shell without moving device
  or attendance logic out of verified handlers.

## Login (`/auth/login`)

- Source: `app/auth/login/page.tsx` (about 660 lines).
- Uses React Hook Form only here; also manages geolocation/browser permission UI.
- Calls `AuthStore.login`, then routes authenticated users.
- High risk: permission prompts, redirects, and credential handling are mixed
  with extensive presentation.

## Teachers (`/teachers`)

- Source: `app/teachers/page.tsx`.
- Admin-only CRUD, search/filter/card-table presentation, credential modal.
- Multipart uploads flow through `TeacherApi.ts`.
- Safe redesign: list/cards/modal visuals. Preserve form field names and admin
  restriction.

## Classrooms (`/classroom`)

- Source: `app/classroom/page.tsx` (about 776 lines).
- Admin and teacher listing; admin mutations; student CRUD; admin-only promotion.
- Promotion depends on active even semester, target context, target capacity,
  and backend decisions. Do not reduce it to a client-side array move.
- Responsive table/card variants duplicate presentation paths.

## Student detail (`/classroom/student/[student_id]`)

- Displays student profile and related academic/attendance information.
- Preserve dynamic `student_id` and instance-scoped API lookup.
- Historical report navigation should link to `/reports/students/[student_id]`
  with a semester query, rather than duplicating calculations here.

## Schedule attendance (`/classroom/schedule/[schedule_id]`)

- Interactive student attendance and assessment submission.
- Persists unsent draft state as `draft-{schedule_id}` in localStorage.
- High risk: atomic submission payload and draft cleanup must survive redesign.

## Schedule history (`/classroom/history/[schedule_id]`)

- Read-oriented view of completed session attendance/assessment.
- Safe for visual redesign after response fields are typed.

## Schedule management (`/schedules`)

- Source: `app/schedules/page.tsx` (about 714 lines).
- Uses `react-big-calendar`, Moment, schedule CRUD, and subject management.
- Both calendar and mobile/list presentations exist.
- Missing: an explicit assessment-period control is not consistently visible in
  every form even though domain/API types support `regular|uts|uas`.

## Reports (`/reports`)

- Teacher and student tabs; URL stores only `tab`.
- `app/reports/page.tsx` contains `mockSchedules`; this is technical debt and
  must not become production report data.
- Student tab consumes legacy response routes. Teacher attendance uses real API.
- Missing: semester selector, canonical report migration, complete report
  generator functions.

## Student performance (`/reports/students/[student_id]`)

- Large legacy response renderer with attendance summaries, accomplishment
  editing, STIFIN display, and PDF download.
- Currently always loads the active semester through the legacy store action.
- Required future behavior: read `academic_year_id`, call canonical endpoint,
  show closed semesters read-only, download semester-specific PDF.

## Profile (`/profile`)

- Profile/account, instance map, academic years, classrooms, and system info.
- Admin sees instance and academic-year workflows; both roles see profile data.
- Academic-year activation now invokes a transition API when moving forward.
  This is business-critical and must not be replaced by local state toggling.

## Error pages

`/403`, `app/not-found.tsx`, and `app/global-error.tsx` are safe visual redesign
targets provided navigation/retry semantics remain present.

