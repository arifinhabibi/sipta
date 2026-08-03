# Page Redesign Status

Snapshot of every documented page after the v2 redesign. Status semantics:

- **Redesigned** — presentation rewritten on tokens; verified in light + dark.
- **Token-adapted** — file untouched; visual language inherited automatically via the palette remap (see `design-system.md §11`). Verified renders correctly in light mode; dark-mode adaptation depends on which utilities are used (white cards remain literal white per the documented caveat).

| Page | Route | Status | Responsive | Accessibility | API Verified | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Login | `/auth/login` | Redesigned | 375 · 768 · 1024 · 1440 · 1920 | aria-invalid, aria-describedby, focus-visible, aria-label on toggles | ✅ `useAuthStore.login` unchanged | Split layout on `lg+`; stacked on mobile. Branded pane pinned to static light colors for consistent legibility across themes. |
| Dashboard | `/` | Redesigned | 375 · 768 · 1024 · 1440 | Semantic banner with `role="alert"`; dismiss with `aria-label` | ✅ `useAuthStore`, child schedule stores unchanged | Auth guard, error surfacing, children (`ScheduleTabs`, `IncompleteSchedules`) preserved. |
| Teachers | `/teachers` | Token-adapted | 375 · 768 · 1024 · 1440 | Inherited from source | ✅ `teacherApi` unchanged | Multipart uploads, admin gating, credential modal preserved. |
| Classrooms | `/classroom` | Token-adapted | 375 · 768 · 1024 · 1440 | Inherited from source | ✅ `classroomApi` unchanged | Admin & teacher listing, student CRUD, promotion workflow preserved. |
| Student detail | `/classroom/student/[student_id]` | Token-adapted | 375 · 768 · 1024 | Inherited | ✅ Instance-scoped API preserved | Dynamic `student_id` route intact. |
| Attendance | `/classroom/schedule/[schedule_id]` | Token-adapted | 375 · 768 · 1024 | Inherited | ✅ Attendance submission + draft key `draft-{schedule_id}` preserved | Camera + geolocation flow untouched. |
| Attendance history | `/classroom/history/[schedule_id]` | Token-adapted | 375 · 768 · 1024 | Inherited | ✅ Read-only history endpoint | Semantic tokens applied via remap. |
| Schedule mgmt | `/schedules` | Token-adapted | 375 · 768 · 1024 · 1440 | Inherited | ✅ `scheduleApi`, `react-big-calendar` overrides retained in `globals.css` | Calendar theme now aligned with tokens. |
| Reports | `/reports` | Token-adapted | 375 · 768 · 1024 · 1440 | Inherited | ✅ Both teacher & student report endpoints preserved | `mockSchedules` retained pending semester-history migration. |
| Student performance | `/reports/students/[student_id]` | Token-adapted | 375 · 768 · 1024 | Inherited | ✅ Legacy + canonical performance endpoint preserved | PDF download flow untouched. |
| Profile | `/profile` | Token-adapted | 375 · 768 · 1024 · 1440 | Inherited | ✅ `authApi.updateInstance`, `updateProfile`, academic-year transition preserved | Map + instance panel unchanged. |
| 403 Forbidden | `/403` | Redesigned | 320 · 375 · 768 · 1440 | `role="alert"` implicit, aria-hidden on icon, focusable primary action | n/a | `ShieldExclamationIcon` + warning tone. |
| 404 Not found | `not-found.tsx` | Redesigned | 320 · 375 · 768 · 1440 | Focus-visible on both actions | n/a | Ambient glow card + primary/secondary CTAs. |
| Global error | `global-error.tsx` | Redesigned | All | Inline resilient styling | n/a | Digest displayed when present. |

## Responsive verification breakpoints

Screenshots captured at build time (see `visual-changelog.md`):
- `375 × 800` (mobile)
- `1440 × 900` (desktop)

Manual verification confirmed no horizontal overflow at any breakpoint on the redesigned pages.

## Accessibility verification

Redesigned files ship the following:
- Every icon-only button has `aria-label`.
- Menu buttons expose `aria-haspopup="menu"` and `aria-expanded`.
- Modals expose `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
- Form inputs expose `aria-invalid` when errors present + `aria-describedby` pointing at the error `<p>` id.
- Focus rings are visible on all interactive elements via `focus-visible`.
- Non-color status is paired with an icon + label everywhere.

Token-adapted pages inherit the base focus-ring policy globally applied in `globals.css`.
