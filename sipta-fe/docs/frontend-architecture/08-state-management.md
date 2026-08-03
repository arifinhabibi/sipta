# 08. State Management

## State model

| Type | Current implementation |
| --- | --- |
| Local UI | extensive `useState`, `useMemo`, `useCallback`, `useEffect` |
| URL | `?tab=` on reports; dynamic route params |
| Form | mostly controlled local objects; React Hook Form only on login |
| Global client/server data | Zustand stores in `src/state/` |
| Persisted | AuthStore via Zustand persist; direct localStorage readers |
| Draft | `draft-{schedule_id}` localStorage key on attendance page |
| Server cache | none; stores manually refetch |

## Store inventory

| Store | File | State/actions | Persistence / risk |
| --- | --- | --- | --- |
| Auth | `src/state/AuthStore.ts` | tokens, expiry, user, instance, academic year, profile, login/logout/refresh/init | persisted as `auth-storage`; critical |
| Academic year | `AcademicYearStore.ts` | list, CRUD, activate, close, rollover, transition | activation may close/copy/activate on backend; critical |
| Classroom | `ClassroomStore.ts` | classes, promotion context, student/classroom CRUD/promotion | promotion payload derives semester IDs; high |
| Schedule | `ScheduleStore.ts` | current/list/today/incomplete, attendance, accomplishments, CRUD | manual request dedup for schedule list; high |
| Study | `StudyStore.ts` | subject CRUD | passes unused academic-year argument to API wrapper; debt |
| Teacher | `TeacherStore.ts` | teacher CRUD/detail | multipart API calls |
| Report | `ReportStore.ts` | attendance/performance/download/update | empty generator APIs and legacy contracts |

Auth persistence stores access token, refresh token, token expiry, user,
instance, and academic year. `HeaderComponent`, dashboard, schedules, and
classroom code also parse `auth-storage` directly, which can diverge from the
hydrated store.

## Business-critical state transitions

- Token rotation updates both Axios authorization and persisted tokens.
- `setActiveAcademicYear` determines whether to use atomic semester transition
  versus direct activation.
- Classroom promotion must use `promotionContext.current_academic_year` and
  `target_academic_year`; IDs cannot be guessed from UI labels.
- Attendance page draft removal occurs only after successful submission.

## Redesign boundary

Visual state can be reorganized. Do not replace Zustand, storage keys, action
signatures, or transition branching as part of a cosmetic redesign. Introduce a
server-cache library only through a planned migration that defines invalidation
for every mutation.

