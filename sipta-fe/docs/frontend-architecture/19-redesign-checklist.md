# 19. Redesign Checklist

## Preparation

- [ ] Read this directory index, risk guide, business boundaries, and manifest.
- [ ] Record current route screenshots and API payloads for the pages in scope.
- [ ] Identify active role(s), active semester, closed semester, and representative empty/error data.
- [ ] Establish lint/build baseline and do not attribute old diagnostics to new work.
- [ ] Add regression coverage or a repeatable manual script for high-risk behavior in scope.

## Design system

- [ ] Map existing hardcoded colors to semantic tokens without changing status meaning.
- [ ] Define typography, spacing, radius, shadow, focus, disabled, and motion tokens.
- [ ] Verify contrast and reduced-motion behavior.
- [ ] Define accessible buttons, fields, dialogs, alerts, loading, and empty-state primitives.
- [ ] Plan HeroUI migration/retention explicitly; do not mix a third library casually.

## Component and layout migration

- [ ] Preserve every component callback, payload, identifier, and loading guard.
- [ ] Extract presentation separately from fetching/business logic in oversized components.
- [ ] Migrate root provider/layout without changing initialization order.
- [ ] Keep header route destinations, role visibility, logout, and mobile access intact.
- [ ] Verify modal focus trap, Escape policy, initial focus, and restoration.

## Page migration

- [ ] Migrate one route at a time using `page-component-matrix.md`.
- [ ] Verify direct URL, navigation, refresh, loading, empty, error, and populated states.
- [ ] Retain dynamic route parameter names.
- [ ] Remove no working feature merely because its UI is difficult to redesign.
- [ ] Use only authoritative API data.

## Semester student report

- [ ] Load semester options from the academic-year API.
- [ ] Store selected `academic_year_id` in the URL query string.
- [ ] Request the canonical per-student report for that exact UUID.
- [ ] Label active versus closed terms and show closed reports read-only.
- [ ] Keep assessment editing unavailable for historical terms.
- [ ] Handle no-placement/no-report separately from network failure.
- [ ] Export the selected semester, not an implicit active semester.

## Responsive and accessibility

- [ ] Test narrow mobile, tablet, laptop, and wide desktop layouts.
- [ ] Verify tables, maps, calendars, dialogs, and long Indonesian text without clipping.
- [ ] Complete all workflows by keyboard with visible focus.
- [ ] Verify labels, accessible names, headings, announcements, and non-color status cues.
- [ ] Test camera/geolocation permission denial and recovery.

## API, auth, and form regression

- [ ] Compare HTTP method, URL, query, payload, upload encoding, and response mapping.
- [ ] Test login, reload/session restore, refresh expiration, logout, unauthorized, and forbidden roles.
- [ ] Test required/invalid/server-error/success/double-submit behavior for each changed form.
- [ ] Test academic-year transition and promotion only with disposable/local test data.
- [ ] Confirm attendance draft recovery still uses `draft-{schedule_id}`.

## Validation and deployment readiness

- [ ] `npm run lint` has no new diagnostics.
- [ ] `npm run build` succeeds.
- [ ] No real endpoint was replaced by mock/random data.
- [ ] Environment variable names and remote-image requirements are documented for deployment.
- [ ] Production serving uses a reviewed production configuration, not an unreviewed dev server.
- [ ] Rollback and smoke-test steps are recorded before release.
