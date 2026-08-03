# 17. Technical Debt

## Prioritized inventory

| Category / issue | Evidence | Impact | Severity | Suggested direction | Before redesign? |
| --- | --- | --- | --- | --- | --- |
| Architecture: client-heavy pages | most `app/**/page.tsx` files declare `"use client"` | large components, coupled fetching/rendering | High | isolate view models and feature containers incrementally | For high-risk pages |
| Maintainability: oversized components | `StudentTab.tsx`, `StudentDetailModal.tsx`, classroom/schedule pages and attendance panels are hundreds of lines | difficult review and regression isolation | High | extract presentation sections without moving business rules initially | Yes for affected page |
| API: legacy typo and canonical report contracts coexist | `src/infrastructure/ReportApi.ts` uses both `perfomance-students` and `performance-students` | response/term behavior can be mixed | Critical | migrate readers to canonical contract; retain legacy edit only where required | Yes for report redesign |
| Data integrity: report page creates mock/random schedule content | `app/reports/page.tsx` | UI may present non-authoritative data | Critical | replace with real API data in a dedicated functional change | Yes |
| API: incomplete methods | empty report generator methods in `ReportApi.ts` | callers would silently receive no useful result | High | implement or remove only after confirming backend contracts | Before use |
| API: ignored argument | `StudyApi.ts` accepts `academic_year_id` but does not send it | ambiguous term scoping | High | align client/backend contract with tests | Before term-aware subject UI |
| State: `any` and duplicate domain shapes | APIs/stores and `src/domain/*` | runtime field drift and weak refactoring safety | High | canonical DTOs plus view-model adapters | Preferably |
| Security: tokens persisted in browser storage | `src/state/AuthStore.ts` | XSS can expose bearer/refresh tokens | High | backend/security-led session strategy; harden XSS surface meanwhile | Not a visual change |
| Security: header reads persisted auth directly | `app/components/Header.tsx` | duplicate session source and stale UI risk | Medium | consume one AuthStore selector | Before header rewrite |
| Auth: route protection is client-only | `ProtectedRoute.tsx`; no middleware | protected UI may render only after hydration and server navigation is not guarded | High | evaluate middleware/server authorization with backend contract | Separate project |
| Feedback: no route loading/error boundaries | no segment `loading.tsx`/`error.tsx` | inconsistent transition failures | Medium | add route boundaries with shared feedback primitives | During redesign |
| Accessibility: modal behavior not centralized | many feature-specific modal files | inconsistent keyboard/focus semantics | High | accessible shared dialog shell, then migrate safely | Yes |
| Testing: no automated suites | package/config/file inventory | business regressions go undetected | Critical | add contract/component/E2E coverage in risk order | Yes for risky flows |
| UI consistency: hardcoded utility palettes | components and `app/globals.css` | inconsistent visual states and expensive rebranding | Medium | semantic tokens before page migration | Yes |
| DX: no typecheck/test scripts | `package.json` | incomplete local/CI gates | Medium | add only with an agreed clean baseline | Recommended |
| Deployment: container runs dev server | `Dockerfile` | inefficient/unsafe production operation | High | multi-stage deterministic production build | Before container production |
| Performance: no server-state cache/cancellation | stores and Axios layer | duplicated requests/stale race potential | Medium | measure, then introduce one intentional server-state strategy | No |
| Organization: application code split across root `app/` and `src/` | repository tree | navigation and ownership are less obvious | Low/Medium | document boundaries; avoid mass move during redesign | No |

## Redesign blockers

For a general visual refresh, the hard blockers are not every debt item. Resolve or isolate the legacy/canonical report split, mock report data, high-risk modal behavior, and absent regression coverage for the specific page being changed. Token storage, server rendering, and folder reorganization require separate architecture/security decisions and should not be smuggled into visual work.

## Conflicting implementations

- Student reporting has legacy misspelled endpoints and newer canonical endpoints in the same API module.
- Login uses a form library while feature forms use controlled local state.
- Domain types and API response usage are partly explicit and partly `any`.
- HeroUI components coexist with extensive custom Tailwind markup.

These conflicts are documented facts, not instructions to merge them without contract tests.
