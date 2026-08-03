# 09. Data Fetching and API

## Client architecture

`src/infrastructure/Instance.ts` creates one Axios client:

- base URL: `NEXT_PUBLIC_API_BASE_URL`, with a localhost fallback;
- timeout: 10 seconds;
- `withCredentials: true`;
- JSON accept header;
- bearer token installed through `setAuthToken()`.

`SetupInterceptor.ts` merges authorization headers, retries selected transient
statuses, and on 401 calls `AuthStore.refreshAuthToken()` before retrying.
Interceptor setup is initiated by `app/providers.tsx`.

There is no cache, pagination framework, cancellation policy, optimistic update
framework, SSE, WebSocket, or streaming implementation. Blob downloads use
object URLs; uploads use `FormData`.

## API dependency inventory

| Feature | Method/endpoints | Client file | Response/use |
| --- | --- | --- | --- |
| Auth | `POST auth/sign-in`, `POST auth/refresh`, `DELETE auth/sign-out`, `GET me` | `AuthApi.ts` | token envelope/profile |
| Instance/password | `POST admin/instance`, `PUT auth/change-password` | `AuthApi.ts` | JSON envelope |
| Teachers | `GET teachers`, `GET teachers/:id`, admin create/delete, `POST teachers/:id` | `TeacherApi.ts` | JSON/multipart |
| Classrooms/students | classroom and student CRUD | `ClassroomApi.ts` | JSON/multipart |
| Promotion | `GET teachers/classrooms/target-upgrade`, `POST students/promoted` | `ClassroomApi.ts` | context and placements |
| Academic years | list/CRUD/activate/close/rollover/transition | `AcademicYearApi.ts` | JSON envelope |
| Schedule | list/detail/today/incomplete/admin CRUD | `ScheduleApi.ts` | JSON envelope |
| Presence | teacher multipart check-in, student JSON attendance | `ScheduleApi.ts` | JSON envelope |
| Subjects | `schedules/subjects/*` | `StudyApi.ts` | JSON envelope |
| Teacher reports | attendance list and export | `ReportApi.ts` | JSON/blob |
| Student legacy report | typo path `reports/perfomance-students/*` | `ReportApi.ts` | legacy nested response/blob |
| Student canonical report | `reports/performance-students/*` with optional semester | `ReportApi.ts` | canonical performance response |

## Contract caveats

- `ApiResponse.ts` introduces `ApiEnvelope<T>`, but many wrappers/stores remain
  `any`.
- Legacy and canonical student reports have different response shapes.
- `generateStudentReport`, `generateBulkReport`, `generateTeacherReport`, and
  `generateClassroomReport` in `ReportApi.ts` have empty bodies.
- `StudyApi.ts` accepts `academic_year_id` arguments but does not include them in
  requests.
- Error propagation varies: some stores swallow errors, some return envelope
  data, and some rethrow Axios errors.

## Semester history contract

Use canonical endpoints with `academic_year_id`. The selected ID must come from
`GET /instance/academic-years`; never infer it from year-name strings. Closed
semester reports are read-only. The legacy update endpoint remains active-term
oriented and must not be exposed when viewing history.

