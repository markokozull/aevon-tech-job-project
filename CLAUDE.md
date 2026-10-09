# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

React 19 + TypeScript + Vite 8 single-page app. Package manager is **Yarn** (`yarn.lock`). UI library: **MUI** (`@mui/material`, `@mui/icons-material`) with Emotion as the styling engine.

## Task brief

This is a job-interview task: an invoice review & confirmation UI for an accountant. The full brief is below; read it before making product or UI decisions.

@docs/TASK.md

Working implications:
- Judged on the reasoning behind decisions, not on feature count. When proposing a feature, state the user reason for it; push back on scope that can't be justified.
- The README sections (persona, decisions, questions, metrics, AI usage) must be in the candidate's own words. Help with structure and ideas, but don't ghost-write them wholesale.
- Commit history is reviewed: commit in small, meaningful steps; never squash or rewrite history.
- The load → review → confirm path for one invoice will be walked through live, so keep that code path readable and easy to trace.

## Commands

```bash
yarn install       # install dependencies
yarn dev           # start Vite dev server with HMR
yarn build         # type-check (tsc -b) then production build to dist/
yarn lint          # ESLint over the whole project
yarn preview       # serve the built dist/ locally
```

There is no test runner configured yet. `yarn build` is the type-check gate — `tsc -b` must pass before Vite builds.

## Structure

- `index.html` → `src/main.tsx` (mounts `<App />` into `#root` under `StrictMode`) → `src/App.tsx`.
- `main.tsx` wraps the app in MUI `ThemeProvider` + `CssBaseline` and loads Roboto (300/400/500/700) via `@fontsource/roboto`. The theme lives in `src/theme.ts` — customize palette/typography there rather than per-component.
- `App.tsx` is the layout shell: a MUI `Drawer` sidebar (`src/components/Sidebar.tsx`; permanent from the `md` breakpoint up, below it a drawer opened from `MobileTopBar`) plus a main area. Sections are defined once in `src/navigation.ts` (`SectionId` + `NAV_ITEMS`); the active section is plain `useState` in `App` (no router).
- Feature code lives in `src/features/<feature>/`: `components/` (React components), `hooks/`, `utils/` (plain logic, no React), with `types.ts` and, for invoices, `data.ts` (the data entry point) at the top. App-wide components are in `src/components/`.
- Styling goes through the MUI theme and `sx`; `src/index.css` is intentionally near-empty.
- New files use double quotes + semicolons (the user's formatter).

## TypeScript / lint constraints

The TS config is split: `tsconfig.app.json` covers `src/`, `tsconfig.node.json` covers `vite.config.ts`. Settings that affect how code must be written:

- `verbatimModuleSyntax` — type-only imports must use `import type`.
- `erasableSyntaxOnly` — no `enum`, `namespace`, or constructor parameter properties; use union types / `as const` objects instead.
- `noUnusedLocals` / `noUnusedParameters` — unused symbols fail the build.
- ESLint `react-refresh` rule — files exporting components should only export components, or HMR breaks.
- ESLint `react-hooks` recommended rules are enabled.

## Code practices

- **Types:** no `any` (enforced by lint). Avoid `as` casts and `!`: narrow with a type guard, or fix the type so the cast isn't needed. If a cast is truly unavoidable (e.g. the JSON import), keep it at that one boundary with a comment saying why.
- **Untrusted data** (`invoices.json`, `localStorage`) is checked where it enters the app (`data.ts`, `useReviewState`), never deeper in the UI.
- **Reuse, don't duplicate:** before writing a helper, check `format.ts`, `status.ts` and `corrections.ts`. Extract a shared helper or component once there's a second real use, or when it makes the load → review → confirm path easier to follow. Not speculatively.
- **One job per function and component.** Split a component into its own file when it's reused or the parent gets hard to read.
- **No magic numbers** in layout or logic: name them (e.g. `LINE_HEIGHT`, `LOW_CONFIDENCE`).
- **Comments say why, not what.** UI text is Croatian; code and comments are English.
- **Verify behaviour, not just types:** run logic changes against `invoices.json`; measure layout changes in a real browser when possible.
