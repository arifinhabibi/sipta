# 13. Responsive Design and Accessibility

## Responsive implementation

Responsive behavior is implemented with Tailwind utility variants in page and component markup. Tailwind v4 default breakpoints apply because no custom breakpoint configuration was found (`app/globals.css`, `postcss.config.mjs`). Common patterns are stacked mobile layouts, `md:`/`lg:` grids, desktop tables with overflow, and alternate desktop/mobile navigation in `app/components/Header.tsx`.

- Mobile navigation is provided by `Header.tsx`; there is no separate sidebar or bottom-navigation architecture.
- Data-heavy classroom, schedule, teacher, and report screens use responsive grids or horizontal overflow, but wide tables remain the main risk.
- Modals use component-specific sizing rather than a shared viewport-safe dialog primitive.
- Leaflet and calendar views have their own CSS/layout constraints (`app/globals.css`, map/calendar components).

## Accessibility findings

### Critical

No repository-wide critical defect was proven through automated or assistive-technology testing. This does **not** mean the application conforms to WCAG; no accessibility test suite exists.

### High

- Complex custom modals do not share verified focus trapping, initial focus, Escape handling, or focus restoration. Affected files include modal components under `app/components/`.
- Icon-only and compact action controls are not consistently documented with accessible names; inspect each consumer of `@heroicons/react` before visual replacement.
- Camera and geolocation attendance flows need equivalent text instructions and recoverable permission-denied paths (`AbsensiModal.tsx`, `MapView.tsx`).

### Medium

- Large responsive tables may require horizontal scrolling without a consistent caption or mobile alternative.
- Semantic heading order, form association, and live announcements vary because forms are independently implemented.
- Hardcoded blue/indigo/gray combinations require contrast verification when states or backgrounds change.
- Loading and toast updates are not proven to be consistently announced to screen readers.
- There is no explicit reduced-motion strategy despite `framer-motion` being installed.

### Low

- Touch target sizing and visible focus styling are inconsistent across locally styled controls.
- Repeated status colors lack a central text/icon fallback convention.

## Redesign acceptance criteria

- All controls must be reachable and operable by keyboard with visible focus.
- Every icon-only control needs an accessible name.
- Dialogs must trap focus, support Escape when safe, restore focus, and label title/description.
- Forms must associate labels, help text, and errors with inputs; invalid submission must move/announce focus appropriately.
- Tables need headings, captions/context, and a usable small-screen strategy.
- State must never be communicated by color alone.
- Contrast must meet WCAG AA for normal text and controls.
- Camera/map failure must have a textual recovery path.
- Respect `prefers-reduced-motion` for nonessential motion.

These are recommended quality gates, not claims about current compliance.
