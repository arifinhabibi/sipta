# 05. Layout Architecture

## Current nesting

```text
app/layout.tsx
`-- Providers (app/providers.tsx)
    `-- route page
        |-- ProtectedRoute (page-owned)
        |-- HeaderComponent (page-owned and repeated)
        `-- page feature content
```

`app/layout.tsx` loads Geist fonts, global CSS, metadata, `Providers`, and a
global `react-hot-toast` toaster. There is no authenticated nested layout,
public route group, dashboard layout, sidebar layout, footer shell, or modal
portal root.

## Providers

`app/providers.tsx` installs:

1. `HeroUIProvider`;
2. `AuthInitializer`, which calls `initializeAuth()`;
3. Axios interceptor setup after auth initialization.

This file is behavior-sensitive despite being visually empty.

## Repeated shell

Most protected pages manually render `ProtectedRoute`, `HeaderComponent`, page
background, max-width container, and padding. This repetition is a verified
candidate for a future authenticated layout, but migration must be incremental
because some pages also wrap loading/error branches separately.

## Responsive navigation

`HeaderComponent.tsx` owns both desktop horizontal navigation and mobile icon
navigation. Reports also has `MobileNavigation.tsx`, creating overlapping
navigation concepts. No persistent sidebar or bottom-navigation layout exists.

## Redesign safety

- Safe: root body styling, container widths, visual navigation treatment,
  header composition, and page background.
- High risk: removing `Providers`, moving interceptor setup, changing
  `ProtectedRoute` timing, or reading auth storage under server rendering.
- Recommended order: introduce an authenticated shell component first, then
  migrate one page at a time while preserving page-level guards until verified.

