# 14. Environment and Configuration

## Toolchain

| Concern | Current implementation | Evidence |
| --- | --- | --- |
| Framework | Next.js 15.5.4, App Router | `package.json`, `app/` |
| Runtime UI | React 19.1, TypeScript strict/no-emit | `package.json`, `tsconfig.json` |
| Package manager | npm, lockfile committed | `package-lock.json` |
| Development | `npm run dev` (`next dev --turbopack`) | `package.json` |
| Production build | `npm run build` (`next build --turbopack`) | `package.json` |
| Start | `npm start` | `package.json` |
| Lint/format | Biome 2.2, recommended Next/React domains | `biome.json`, `package.json` |
| Styling | Tailwind CSS v4 PostCSS plugin | `postcss.config.mjs`, `app/globals.css` |
| Deployment image | Node 18 Alpine; installs dependencies and starts dev server | `Dockerfile` |

There is no ESLint configuration, Prettier configuration, standalone `typecheck` script, or test script. Next.js build performs TypeScript validation. The `@/*` alias resolves from the repository root.

## Environment variables

| Variable | Purpose | Required | Scope | Sensitive |
| --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Axios backend base URL | Recommended; local fallback exists | Browser/client | No, but deployment-specific |
| `NEXT_PUBLIC_ASSET` | Base URL used for public/backend-hosted assets | Feature-dependent | Browser/client | No, but deployment-specific |

Only names and purposes are documented. Values must remain in environment-specific secret/configuration management and must not be copied into docs.

## Next.js configuration

`next.config.ts` configures remote image sources. It contains environment-specific hosts in addition to localhost. Review these allowlists during deployment without broadening them to arbitrary hosts. No redirects, rewrites, custom response headers, or experimental flags are defined.

## Deployment observations

`Dockerfile` currently runs `npm install` and `npm run dev`. That is suitable for development, not an optimized production image. A production change should use the lockfile deterministically, build once, and run `next start` (or a standalone output) after validating the deployment platform. This is a recommendation only; the Dockerfile is unchanged.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
npm start
```

There are no repository-defined `npm test` or `npm run typecheck` commands. Do not invent them in automation without agreeing on tools and baselines.
