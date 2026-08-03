# 03. Routing and Navigation

The application uses the Next.js **App Router**. There is one root layout and no
route groups, nested layouts, parallel routes, intercepting routes, or
`middleware.ts`.

## Route inventory

| Route | File | Access | Main feature | Primary API/store dependencies |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | admin, teacher | dashboard/today/incomplete schedules | AuthStore, ScheduleStore |
| `/auth/login` | `app/auth/login/page.tsx` | public | login and browser permission guidance | AuthStore/AuthApi |
| `/403` | `app/403/page.tsx` | public | forbidden state | none |
| `/teachers` | `app/teachers/page.tsx` | admin | teacher CRUD and credentials | TeacherStore |
| `/classroom` | `app/classroom/page.tsx` | admin, teacher | classes, students, promotion | ClassroomStore, TeacherStore |
| `/classroom/student/[student_id]` | corresponding `page.tsx` | admin, teacher | student detail | classroom/student APIs via stores |
| `/classroom/schedule/[schedule_id]` | corresponding `page.tsx` | admin, teacher | take attendance/assessment | ScheduleStore, local draft storage |
| `/classroom/history/[schedule_id]` | corresponding `page.tsx` | admin, teacher | completed schedule history | ScheduleStore |
| `/schedules` | `app/schedules/page.tsx` | admin, teacher | calendar, schedule/subject management | ScheduleStore, StudyStore, TeacherStore |
| `/reports` | `app/reports/page.tsx` | admin, teacher | teacher attendance/student reports | ReportStore plus teacher/classroom/schedule stores |
| `/reports/students/[student_id]` | corresponding `page.tsx` | admin, teacher | legacy student report and score editing | ReportStore |
| `/profile` | `app/profile/page.tsx` | admin, teacher | profile, instance, semesters, account | AuthStore, AcademicYearStore |
| fallback | `app/not-found.tsx` | public | unknown route | none |

All routes inherit `app/layout.tsx`. There are no route-level `loading.tsx` or
`error.tsx` files. `app/global-error.tsx` and `app/not-found.tsx` are the only
framework error fallbacks.

## Protection and redirects

`app/components/ProtectedRoute.tsx` performs client-side checks after auth store
rehydration. Missing tokens redirect to `/auth/login`; disallowed roles redirect
to `/403`. The explicit `checkTokenValidity()` call is currently commented out,
so interceptor-driven validation is more important than the component suggests.
Backend authorization remains mandatory; this component is not a security
boundary by itself.

## Navigation

`app/components/HeaderComponent.tsx` renders desktop and mobile links. Teacher
management is admin-only. Other main links are dashboard, classroom, schedules,
reports, and profile. Active state uses exact pathname equality, so dynamic child
routes do not highlight their parent link.

`app/reports/page.tsx` stores the active report tab in `?tab=teachers|students`.
No other stable URL state was found. Breadcrumbs are not implemented; dynamic
screens typically call `router.back()`.

## Semester-report route recommendation

Preserve `/reports/students/[student_id]`. Add an optional query parameter
`academic_year_id`, not a new route identity. This supports shareable history
links while retaining existing navigation. Details are specified in
`21-semester-student-report.md`.

