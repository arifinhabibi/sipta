# 11. Forms and Validation

## Current pattern

Most forms are client components with controlled `useState` values and manual checks. The login page is the notable exception: it uses `react-hook-form` in `app/auth/login/page.tsx`. No schema library such as Zod or Yup is installed. Validation rules are therefore distributed across components and backend responses.

## Form inventory

| Form | Source | Main data | Validation | Submission and result |
| --- | --- | --- | --- | --- |
| Login | `app/auth/login/page.tsx` | username, password | `react-hook-form` rules | `AuthStore.login`; redirects on success and renders/toasts errors |
| Instance/profile | `app/profile/page.tsx` | account password and instance data | local/manual | `AuthApi.changePassword` and `AuthApi.updateInstance` |
| Teacher create/edit | `app/components/teachers/TeacherModal.tsx` | identity, credential/profile fields, photo | local/manual; multipart | `TeacherStore` -> `TeacherApi`; closes/refetches on success |
| Classroom create/edit | `app/components/classrooms/ClassroomModal.tsx` | classroom identity and teacher relation | local/manual | `ClassroomStore` -> `ClassroomApi` |
| Student create/edit | `app/components/classrooms/StudentModal.tsx` | identity, classroom placement, profile/photo | local/manual; multipart | `ClassroomStore` -> `ClassroomApi` |
| Academic year | `app/components/classrooms/AcademicYearModal.tsx` | year/term/status-related values | local/manual | `AcademicYearStore` -> `AcademicYearApi` |
| Promotion/upgrade | `app/components/classrooms/UpgradeStudentModal.tsx` | source students and target classrooms | component business checks | target context from `ClassroomApi`; submits `students/promoted` |
| Schedule create | `app/components/schedules/ScheduleModal.tsx` | classroom, subject, teacher, day/time | local/manual | `ScheduleStore` -> `ScheduleApi.createSchedules` |
| Schedule edit | `app/components/schedules/EditScheduleModal.tsx` | schedule fields | local/manual | `ScheduleStore` -> `ScheduleApi.scheduleUpdate` |
| Subject | `app/components/schedules/SubjectModal.tsx` | subject name/code | local/manual | `StudyStore` -> `StudyApi` |
| Teacher attendance | `app/components/dashboard/AbsensiModal.tsx` | camera image, location, attendance context | browser capability and local checks | multipart through `ScheduleApi.teacherAttendance` |
| Student attendance | `app/components/dashboard/MasukKelasModal.tsx`, `app/classroom/schedule/[schedule_id]/page.tsx` | per-student attendance status | local checks and draft state | `ScheduleApi.studentAttendance` |
| Accomplishment | `app/components/dashboard/AccomplishModal.tsx` | schedule accomplishment content | local/manual | `ScheduleApi.createAccomplish` |
| Teacher report filters | `app/components/reports/teachers/DateRangeModal.tsx`, `DownloadModal.tsx`, `PrintMonthlyModal.tsx` | date range/export options | local/manual | `ReportApi` list/export calls |
| Student assessment | `app/components/reports/students/StudentDetailModal.tsx` | subject assessment values | local/manual and backend errors | legacy `ReportApi.updatePerformanceStudent`; active-term behavior |

## Business rules to preserve

- Keep multipart field names and HTTP methods for teacher/student photo and teacher-attendance uploads (`TeacherApi.ts`, `ClassroomApi.ts`, `ScheduleApi.ts`).
- Preserve schedule identifiers, student identifiers, classroom placement identifiers, and attendance status values; presentation labels may change, submitted values may not.
- Promotion must use target-classroom context returned by the backend; it is not a visual bulk move (`UpgradeStudentModal.tsx`).
- Historical semester reports must be read-only. The legacy assessment update endpoint must not be offered while an archived `academic_year_id` is selected.
- Keep async disabling/loading guards to prevent duplicate submissions.

## Inconsistencies and debt

- Similar required-field and error handling is duplicated across modals.
- Many payloads are typed as `any`, so field drift can compile unnoticed.
- Backend validation messages do not have one normalized renderer.
- Reset behavior varies between closing, successful submission, and reopening a modal.
- The academic-year parameter accepted by `StudyApi.ts` methods is not currently sent.

## Visual redesign boundary

Safe changes include labels, field layout, grouping, spacing, responsive arrangement, help text, and error presentation. Preserve existing submit handlers, payload keys, conversions, upload construction, API calls, confirmation steps, disabled conditions, and post-success refresh behavior. Extracting validation into shared schemas is a separate behavioral refactor and should have regression tests before being combined with a redesign.
