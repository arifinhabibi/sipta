# 07. Design System

## Verified foundations

- Tailwind CSS v4 via `@tailwindcss/postcss` and `@import "tailwindcss"`.
- HeroUI theme plugin loaded through `app/hero.ts` and `HeroUIProvider`.
- Heroicons outline icons dominate application UI.
- Geist Sans and Geist Mono are loaded by `app/layout.tsx`.
- `app/globals.css` defines only two explicit theme colors:
  `--color-primary: #1e40af` and `--color-secondary: #9333ea`.
- Dark variant is declared, but no verified theme switcher or complete dark
  palette was found.

## Current visual language

Pages repeatedly use blue/indigo gradients, white cards, gray borders,
`rounded-xl`/`rounded-2xl`, and medium shadows. Values are mostly hardcoded
Tailwind utilities rather than named tokens. Feature components independently
choose status colors and spacing.

| Element | Current pattern | Consistency |
| --- | --- | --- |
| Primary button | blue/indigo background, white text | multiple shades/sizes |
| Inputs | gray border, rounded-lg, local focus rings | duplicated |
| Cards | white, gray border, rounded-xl/2xl | mostly consistent visually |
| Dialogs | fixed overlay and handwritten panel | several implementations |
| Tables | desktop table plus bespoke mobile cards | feature-specific |
| Badges | Tailwind color maps | status semantics vary |
| Loading | spinners and dedicated loading components | duplicated |
| Empty/error | local panels | inconsistent copy and retry behavior |

Calendar overrides and mobile breakpoints live in `app/globals.css`. The code
uses Tailwind breakpoints (`sm`, `md`, `lg`) extensively. No `tailwind.config.*`,
CSS variable token library, or shared `cn()` utility was found.

## Redesign compatibility

Emergent may introduce semantic tokens and shared primitives, but should:

1. map existing states (success, warning, error, present, late, absent,
   completed, cancelled) before changing colors;
2. keep minimum touch targets already enforced in some global mobile CSS;
3. preserve calendar/Leaflet third-party CSS loading;
4. migrate components incrementally and avoid mixing two meanings under one
   visual status token;
5. retain handler, disabled, loading, and role conditions while replacing JSX.

**Missing:** documented contrast targets, motion/reduced-motion policy, dark-mode
behavior, centralized typography scale, and visual regression baselines.

