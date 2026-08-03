# 16. Testing and Quality

## Current controls

| Control | Status | Command/evidence |
| --- | --- | --- |
| Unit tests | Missing | no test files/framework script found |
| Component tests | Missing | no Testing Library/Vitest/Jest configuration found |
| Integration tests | Missing | no test suite found |
| End-to-end tests | Missing | no Playwright/Cypress configuration found |
| Lint and static rules | Present | `npm run lint` -> `biome check` |
| Type validation | Build-time only | strict `tsconfig.json`; no standalone script |
| Production build | Present | `npm run build` |
| Coverage | Missing | no coverage tooling |
| Accessibility automation | Missing | no axe/Lighthouse CI configuration |
| Visual regression | Missing | no screenshot regression tooling |

The absence of tests is especially risky because pages and modals mix UI, state transitions, payload construction, and business rules.

## Critical untested flows

- login, refresh-token success/failure, logout, and role redirects;
- academic-year create/activate/close/rollover/transition;
- odd-to-even semester continuity and student placement visibility;
- student promotion to the next classroom/academic year;
- teacher/student attendance, camera, geolocation, and draft restoration;
- schedule/subject CRUD;
- student assessment updates and PDF/blob downloads;
- selecting and reading each student's historical semester report.

## Minimum redesign verification checklist

- [ ] `npm run lint` introduces no new diagnostics relative to the recorded baseline.
- [ ] `npm run build` succeeds.
- [ ] All documented routes render through direct navigation and in-app navigation.
- [ ] Unauthenticated access redirects to `/auth/login`; forbidden roles reach `/403`.
- [ ] Refresh and logout behavior still use the existing token/storage contract.
- [ ] CRUD forms submit the same method, endpoint, payload keys, and file encoding.
- [ ] Attendance works with permission granted, denied, and unavailable.
- [ ] Active-semester assessment remains editable where authorized.
- [ ] Closed-semester report is selectable and read-only.
- [ ] Semester selection sends the chosen academic-year UUID, including after reload.
- [ ] Empty, loading, error, success, and retry states are distinguishable.
- [ ] Keyboard and small-screen smoke tests cover every page and modal.

## Recommended future testing order

First add API/store contract tests around auth, academic-year transitions, promotion, attendance, and reports. Then add component tests for high-risk modals and Playwright journeys for login, core CRUD, semester transition, promotion, and report history. Add accessibility and visual regression only after stable semantic primitives exist.

## Validation record (2026-08-03)

| Check | Result | Summary |
| --- | --- | --- |
| Internal Markdown links | Pass | every relative Markdown link in this documentation directory resolves |
| Manifest parse | Pass | PowerShell `ConvertFrom-Json` parsed `frontend-manifest.json` |
| `npm run lint` | Fail: existing source baseline | Biome checked 119 files and reported 579 errors plus 575 warnings; examples include formatting, import ordering, explicit `any`, and unused variables in application source |
| `npm run build` | Pass | Next.js compiled, type-checked, generated 12 static pages, and completed route optimization |
| `npm test` | Not run | no test script or test framework is defined |
| standalone typecheck | Not run | no `typecheck` script exists; the successful Next.js build performed TypeScript validation |

The lint diagnostics are in existing application/configuration files, not the new Markdown/JSON documentation. The build emitted a non-blocking module-type warning for `app/hero.ts`; this is a pre-existing configuration concern.
