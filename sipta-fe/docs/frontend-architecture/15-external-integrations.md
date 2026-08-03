# 15. External Integrations

## Runtime integrations verified in imports

| Integration | Purpose and files | Initialization/config | Failure and redesign risk |
| --- | --- | --- | --- |
| Backend HTTP API (Axios) | all application data; `src/infrastructure/*` | `NEXT_PUBLIC_API_BASE_URL`, interceptor in `app/providers.tsx` | Critical. Preserve routes, payloads, token refresh, blob and multipart behavior. |
| HeroUI | UI provider/components and Tailwind theme plugin; `app/providers.tsx`, `app/globals.css`, feature components | `HeroUIProvider` at root | Visual replacement is possible only through staged component migration. |
| Heroicons | interface icons across components | direct React imports | Preserve accessible names and action meaning. |
| React Hot Toast | global success/error notifications | toaster in `app/layout.tsx` | Keep trigger semantics if visuals change. |
| Leaflet / React Leaflet | location/map display for attendance-related UI | CSS in `app/globals.css`; map components | Browser/SSR and sizing sensitive; keep client-only boundaries. |
| Browser geolocation | location capture/validation in attendance flow | browser permission at runtime | Permission denial and unavailable-location paths must remain recoverable. |
| React Webcam | camera capture for teacher attendance | browser media permission in attendance modal | Preserve consent, fallback, image payload, and stop media tracks on close. |
| React Big Calendar / Moment | schedule/calendar presentation | component imports and global calendar CSS | Date/time formatting and local timezone behavior are business-sensitive. |
| STIFIN utility | student-related classification/display logic | utility/component imports | Treat mappings as domain behavior, not decorative copy. |

## Installed but not proven active

`@fullcalendar/*`, `@hello-pangea/dnd`, `framer-motion`, `recharts`, and `@capacitor/core` are declared in `package.json`, but the repository import scan did not establish active production consumers. Do not build architecture around them or remove them solely from this observation; confirm dynamic/generated usage and product intent first.

## Integrations not found

No frontend payment provider, analytics platform, error-tracking SDK, AI provider, rich-text editor, push-notification provider, SSE client, or WebSocket client was found. Authentication is the application backend's token API, not a third-party identity SDK.

## Responsibility boundary

The frontend requests permissions, captures browser data, renders results, and submits defined payloads. The backend remains authoritative for identity, authorization, attendance validity, academic-year state, promotion, assessment calculations, and report generation. A redesign must not reproduce those backend decisions as new client-only rules.
