# 06. Component Architecture

## Classification

| Category | Representative files | Notes |
| --- | --- | --- |
| Layout/navigation | `HeaderComponent.tsx`, `FooterComponent.tsx`, `reports/MobileNavigation.tsx` | Header contains storage and logout logic |
| Route protection | `ProtectedRoute.tsx` | security-sensitive client gate |
| Feedback | `LoadingComponent.tsx`, `ErrorComponent.tsx`, feature `LoadingState.tsx`, delete modals | duplicated patterns |
| Dashboard | `dashboard/*` | attendance, camera, geolocation, schedule entry |
| Classroom | `classrooms/*` | CRUD, responsive list/table, promotion |
| Schedule | `schedules/*` | forms, calendar modals, subjects |
| Reports | `reports/*` | legacy response rendering, PDF, maps, charts |
| Profile | `profiles/*` | instance, academic year, account and profile |
| Teacher | `teachers/*` | multipart CRUD and credentials |

No stable primitive layer (for Button, Input, Card, Dialog) exists across the
whole app. A small report-teacher-only primitive set exists under
`app/components/reports/teachers/` (`Button.tsx`, `Badge.tsx`, `Modal.tsx`) but
is not used as an application-wide design system.

## Important component inventory

| Component | Purpose | Internal behavior | Redesign risk |
| --- | --- | --- | --- |
| `ProtectedRoute` | client access gate | auth initialization, role redirects | critical |
| `HeaderComponent` | global nav/profile/logout | direct localStorage parsing | high |
| `AbsensiModal` | teacher presence | camera, geolocation, image payload | critical |
| `ScheduleTabs` | daily schedule actions | attendance/accomplishment routing | high |
| `IncompleteSchedules` | incomplete session administration | status mutations | high |
| `StudentModal` | student create/edit | multipart documents, manual validation | high |
| `UpgradeStudentModal` | promotion selection | target capacity and selection | high |
| `AcademicYearSection` | semester CRUD/activation | transition workflow and reload | critical |
| `StudentTab` | class/student report list | legacy report response, PDF affordance | high |
| `StudentDetailModal` | report detail/edit | large data transformation | high |
| `TeacherAttendancePanel` | attendance reporting | filters, downloads, maps | high |
| `LocationMap` / `MapView` | Leaflet rendering | dynamic browser-only imports | medium |

## Oversized/mixed components

Verified approximate sizes include `StudentTab.tsx` (1,029 lines),
`StudentDetailModal.tsx` (1,005), `classroom/page.tsx` (776),
`schedules/page.tsx` (714), `TeacherAttendancePanel.tsx` (700), and
`auth/login/page.tsx` (660). These combine orchestration and presentation; they
should be split before or during a controlled redesign, not rewritten at once.

## Duplication

- Delete-confirmation and loading components exist separately for classrooms,
  teachers, and schedules.
- Classroom has card, table, list-screen, and detail-screen variants with
  overlapping rendering.
- Leaflet marker setup is repeated in profile, dashboard, and report components.
- Modal/button/badge primitives are local to report teachers.

## Safe extraction strategy

First extract pure visual primitives with unchanged props. Then extract view
models/selectors from large report components. Keep store calls and submit
handlers in feature containers until contract tests exist.

