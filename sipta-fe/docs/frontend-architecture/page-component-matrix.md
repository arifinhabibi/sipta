# Page–Component Traceability Matrix

| Page | Route | Layout/protection | Main components | Store | API dependency | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/` | root + `ProtectedRoute` | `HeaderComponent`, `DashboardHeader`, `ScheduleTabs`, `IncompleteSchedules`, attendance/accomplishment modals | Auth, Schedule | auth/me, schedules today/incomplete, attendance, accomplishments | High |
| Login | `/auth/login` | root, public | local login form | Auth | sign-in | High |
| Forbidden | `/403` | root, public | Link/icon presentation | none | none | Low |
| Teachers | `/teachers` | root + protected/role checks | teacher table/cards, `TeacherModal`, delete/loading/credential modals | Teacher | teacher CRUD | Medium/High |
| Classrooms | `/classroom` | root + protected/role checks | `ClassroomTable`, `ClassroomCard`, classroom/student/delete/promotion modals | Teacher, Classroom | classroom/student CRUD, target-upgrade, promotion | Critical |
| Student legacy detail | `/classroom/student/[student_id]` | root; protection is not imported in page | inline detail/report UI | Report | legacy per-student performance | High |
| Schedule attendance | `/classroom/schedule/[schedule_id]` | root + `ProtectedRoute` | `HeaderComponent`, `ScheduleSkeleton`, attendance UI | Schedule | schedule detail, student attendance | Critical |
| Schedule history | `/classroom/history/[schedule_id]` | root + `ProtectedRoute` | header and history display | Schedule | schedule detail/history-shaped data | High |
| Schedule management | `/schedules` | root + protected/role checks | calendar, add/edit/delete schedule, subject management | Schedule, Study, Teacher | schedules, subjects, teachers CRUD | High |
| Reports | `/reports` | root + protected/role checks | `StudentTab`, `TeacherAttendancePanel`, loading, filter/export modals | Auth, Teacher, Classroom, Schedule, Report | report, teachers, classrooms, schedules | Critical |
| Student report | `/reports/students/[student_id]` | root + `ProtectedRoute` | inline report/detail, header, STIFIN display | Report | legacy per-student performance and PDF | Critical |
| Profile/settings | `/profile` | root + `ProtectedRoute` | profile, account, instance, academic year, classroom, system sections | Auth, AcademicYear | me/password/instance, academic-year workflow | Critical |

## Shared impact map

- Changing `HeaderComponent` affects all authenticated routes listed above.
- Changing `ProtectedRoute` affects authentication and role behavior across the application.
- Changing `AuthStore` or Axios interceptors affects every API-backed page.
- Changing classroom/student domain shapes affects classroom, attendance, reports, and promotion.
- Changing academic-year identity/status affects profile workflow, subjects/schedules, promotion, and semester reports.
- Changing report response mapping affects both `/reports` and the two student-detail routes.

## Historical-report target

The future semester selector belongs primarily on `/reports/students/[student_id]`. It should use the current root layout, `ProtectedRoute`, AcademicYear state/API, and canonical Report API; see `21-semester-student-report.md`. Avoid adding it to the classroom legacy-detail route until that route's duplication is intentionally resolved.
