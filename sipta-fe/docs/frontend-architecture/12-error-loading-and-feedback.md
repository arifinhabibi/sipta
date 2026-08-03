# 12. Error, Loading, and Feedback

## Implemented feedback layers

| Layer | Implementation | Evidence |
| --- | --- | --- |
| Global render failure | Next.js global error boundary | `app/global-error.tsx` |
| Unknown route | custom not-found page | `app/not-found.tsx` |
| Forbidden access | dedicated page and client redirect | `app/403/page.tsx`, `app/components/ProtectedRoute.tsx` |
| Toasts | one root `react-hot-toast` toaster | `app/layout.tsx` |
| API errors | store/component `try/catch`, Axios errors, toast/text | `src/state/*Store.ts`, feature components |
| Loading | page/component booleans, spinners, disabled buttons | pages and modal components |
| Confirmation | feature-specific delete/logout/transition dialogs | `app/components/**/DeleteConfirmationModal.tsx`, `Header.tsx` |
| Empty data | conditional text/cards in feature pages | classroom, schedule, teacher, and report screens |

There are no route-level `loading.tsx` or `error.tsx` files. There is also no shared skeleton library, normalized API error model, global offline banner, or retry component.

## Behavior by failure type

- **Authentication:** `ProtectedRoute.tsx` shows an initialization/loading phase and redirects missing sessions to `/auth/login`; disallowed roles go to `/403`.
- **Session expiration:** `SetupInterceptor.ts` attempts refresh on a 401, then retries the original request. Terminal refresh failure clears/invalidates authentication through `AuthStore.ts`.
- **Transient network/server error:** `SetupInterceptor.ts` retries selected status codes. Components are not consistently told that a retry is in progress.
- **Form validation:** login exposes field-level rules; other forms generally use local text/toasts or rely on backend validation.
- **Downloads:** report components create blob URLs; failures are surfaced locally/toasts.

## Coverage gaps

| Area | Missing or inconsistent state | Risk |
| --- | --- | --- |
| Reports | student report uses legacy/canonical paths inconsistently; mock schedule-derived content exists in `app/reports/page.tsx` | High: misleading data |
| Historical report | no semester-selector loading, unavailable-term, or archived read-only banner | High: user cannot distinguish term context |
| Route transitions | no segment loading UI | Medium: blank/stale appearance |
| Large tables | loading/empty/error patterns vary | Medium |
| Browser capabilities | camera/geolocation denial guidance is feature-local | Medium |
| Forms | field-level backend errors are not normalized | Medium |
| Global network | no offline state or consistent retry action | Low/Medium |

## Redesign rules

A redesign may replace spinner, skeleton, toast, alert, modal, and empty-state visuals. It must retain the conditions that trigger them and must not turn an API failure into an empty-success state. Destructive, promotion, academic-year transition, logout, and overwrite actions must retain an explicit confirmation where one currently exists. Historical reports need a visible read-only state rather than silently disabling controls.
