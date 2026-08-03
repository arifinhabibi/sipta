# 02. Repository Structure

```text
sipta-fe/
|-- app/                         # App Router routes and UI components
|   |-- auth/login/page.tsx
|   |-- classroom/               # classroom page and dynamic workflow routes
|   |-- components/              # shared and feature UI (not colocated by route)
|   |-- profile/
|   |-- reports/
|   |-- schedules/
|   |-- teachers/
|   |-- layout.tsx               # only shared Next layout
|   |-- providers.tsx            # HeroUI, auth init, Axios interceptor
|   `-- globals.css
|-- src/
|   |-- domain/                  # TypeScript interfaces and store contracts
|   |-- infrastructure/          # Axios client and endpoint wrappers
|   |-- state/                   # Zustand stores
|   |-- stifin/                  # birth-date-derived STIFIN utility
|   `-- utils/                   # localStorage auth helpers
|-- public/                      # default static SVG assets
|-- backup/                      # legacy/backup content; not runtime architecture
|-- docs/frontend-architecture/  # this package
|-- next.config.ts
|-- postcss.config.mjs
|-- biome.json
|-- tsconfig.json
|-- package.json / package-lock.json
`-- Dockerfile
```

## Directory responsibilities

| Path | Current responsibility | Notes |
| --- | --- | --- |
| `app/` | routes and almost all React UI | App Router, but client-heavy |
| `app/components/dashboard/` | daily schedules, check-in, attendance, accomplishments | device/API sensitive |
| `app/components/classrooms/` | classroom/student CRUD and promotion | several large modal components |
| `app/components/reports/` | teacher/student reports | legacy/canonical transition risk |
| `app/components/schedules/` | calendar CRUD and subjects | uses calendar libraries and local form state |
| `app/components/profiles/` | instance, academic year, account/profile panels | admin/teacher behavior mixed |
| `src/domain/` | interfaces | duplicates exist across files; not a normalized domain model |
| `src/infrastructure/` | endpoint wrappers | real API boundary; high-risk |
| `src/state/` | client/global state | async server data is also held here; no cache library |

## Generated and non-manual files

- `.next/`: generated build output; never edit.
- `next-env.d.ts`: Next-generated typing file.
- `tsconfig.tsbuildinfo`: TypeScript incremental cache.
- `node_modules/`: installed dependencies.
- `package-lock.json`: generated lockfile; update only through npm operations.

## Structural inconsistencies

- The repository uses `app/components/` rather than a top-level shared
  `components/` or feature-first structure.
- API/store/domain layers live in `src/`, while route and component logic lives
  in `app/`.
- Several domain names (`AcademicYear`, `Classroom`, `StudentAttendance`) are
  declared more than once with different shapes in `src/domain/`.
- `backup/` and `docs-library.txt` are not imported by runtime code based on the
  current import scan.

