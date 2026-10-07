<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# RPL - Raptee Premier League: Agent Guide

## Project Overview

RPL (Raptee Premier League) is a cricket management web application built with Next.js 16, React 19, TypeScript, and Tailwind CSS v4. It is hosted on Vercel. It covers four core domains:

- **Gameplay** - Match action, ball-by-ball tracking, over management
- **Onboarding** - Team creation, player registration, tournament setup
- **Scoreboard** - Live scores, innings breakdown, run rates, partnerships
- **Budgeting** - Team budgets, player auctions, salary caps, spending analytics

**Data layer**: There is no external database. All persistent data is stored in local JSON files under `src/data/`. API route handlers in `src/app/api/` are the only layer that reads and writes these files. Client components never access JSON files directly.

**Auth model**: Three privileged roles exist: Admin, Captain, and Umpire. Role is stored in `src/data/users.json`. A session token is held in a secure HTTP-only cookie. Public visitors have read-only access and do not need to authenticate.

The application runs on a single cohesive design system. Every page, component, and interaction must feel like it belongs to the same product.

---

## Absolute Rules

### Content and Copy

- Never use LLM-generated filler text. All labels, headings, descriptions, and placeholder copy must reflect real cricket or RPL-specific context.
- Never use double hyphens in user-facing strings, comments inside JSX, or markdown docs committed to this repo.
- Never use emoji anywhere in the codebase: not in UI text, not in code comments, not in commit messages, not in this file.
- Never use lorem ipsum or any dummy placeholder text.
- All cricket terminology must be accurate: overs, balls, wickets, runs, extras (wides, no-balls, byes, leg-byes), DLS, powerplay, death overs.

### Design and UI

- Every page must use the RPL design system defined in `src/styles/theme.css` (see Design System section below).
- No page may introduce a one-off color, font size, border radius, or shadow that is not defined as a design token.
- Components are built once and reused. Never duplicate a component. Check `src/components/` before creating anything new.
- All interactive elements must have visible focus states for keyboard navigation.
- The layout must be responsive. Minimum supported viewport is 375px wide.
- Dark mode is the default and only supported mode for this project.

### Code Quality

- TypeScript strict mode is enabled. Never use `any`. Define explicit types for all props, state, API responses, and utility functions.
- Never suppress TypeScript errors with `@ts-ignore` or `@ts-expect-error` without a comment explaining why it is unavoidable.
- No inline styles. Use Tailwind utility classes or CSS variables from the design system.
- No `console.log` left in committed code. Use a structured logger if debugging output is needed.
- All data-fetching functions must handle loading and error states explicitly.

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Bundler | Turbopack (via next dev) | built-in |

### Key Next.js 16 Behaviours to Know

- `use client` is required at the top of any component that uses browser APIs, hooks, or event handlers.
- Server Components are the default. Fetch data directly inside them without `useEffect`.
- Route handlers live in `src/app/api/**/route.ts`. Use the Web `Request`/`Response` API, not `res.json()`.
- `cacheComponents: true` is enabled in `next.config.ts`. Component output is cached on the server. Do not rely on render-time side effects in Server Components.
- `partialPrefetching: true` is enabled. Navigation feels instant for pre-rendered segments.
- Read `node_modules/next/dist/docs/` before using any Next.js API to confirm the current signature.

---

## Directory Structure

```
src/
  app/                          # Next.js App Router
    layout.tsx                  # Root layout (fonts, global providers)
    page.tsx                    # Home / dashboard entry point
    globals.css                 # Tailwind base + design token imports
    onboarding/                 # Team and player setup flows
      page.tsx
    match/                      # Live match gameplay
      [matchId]/
        page.tsx
    scoreboard/                 # Score display and innings summary
      [matchId]/
        page.tsx
    budget/                     # Budget management and auction
      page.tsx
    api/                        # Route handlers (server-side only)
  components/                   # Shared UI components
    ui/                         # Primitive components (Button, Card, Badge, etc.)
    match/                      # Match-specific components
    scoreboard/                 # Score display components
    budget/                     # Budget and auction components
    onboarding/                 # Setup flow components
    layout/                     # Navbar, Sidebar, PageShell
  lib/                          # Business logic, utilities, types
    types/                      # TypeScript interfaces and types
    utils/                      # Pure helper functions
    cricket/                    # Cricket calculation logic (DLS, run rate, etc.)
  styles/
    theme.css                   # Design tokens (CSS custom properties)
```

---

## Design System

### Colour Palette

All colours must come from CSS custom properties defined in `src/styles/theme.css`. Never hardcode hex or rgb values in component files.

```
--color-bg-base        Background for all pages
--color-bg-surface     Cards, panels, modals
--color-bg-elevated    Tooltips, dropdowns, floating elements
--color-border         Default border colour
--color-border-strong  Emphasis borders, active states

--color-accent         Primary brand accent (amber/gold)
--color-accent-hover   Accent on hover
--color-accent-muted   Subtle accent tint for backgrounds

--color-text-primary   Main body text
--color-text-secondary Captions, labels, metadata
--color-text-disabled  Disabled states
--color-text-inverse   Text on accent backgrounds

--color-status-live    Live match indicator (red)
--color-status-win     Win indicator (green)
--color-status-loss    Loss indicator (muted red)
--color-status-draw    Draw indicator (amber)
--color-status-info    Informational (blue)
```

### Typography

- Font family: System font stack for body. Monospace stack for scores and statistics.
- Never set arbitrary `font-size`, `font-weight`, or `line-height` values. Use the Tailwind scale.
- Score numbers and over counts use the monospace stack so digits do not shift width.

### Spacing

- Use the Tailwind spacing scale (multiples of 4px). Do not use arbitrary spacing values like `px-[13px]`.
- Page content is contained in a max-width wrapper. Use the `PageShell` layout component.

### Component Patterns

- **Cards** - Use `bg-[--color-bg-surface]` with `border border-[--color-border]` and `rounded-xl`.
- **Buttons** - Primary buttons use `bg-[--color-accent]` with `text-[--color-text-inverse]`. Destructive buttons use a red variant. Ghost buttons use transparent backgrounds.
- **Badges** - Small inline labels for statuses (Live, Completed, Upcoming). Always use a status colour token.
- **Tables** - Score tables use monospace numbers. Column headers are uppercase, tracking-wide, text-secondary.

---

## Domain Rules

### Onboarding

- A team must have a name, a captain, and at least 11 registered players before a match can be started.
- Player positions are: Batter, Bowler, All-rounder, Wicketkeeper. These are the only valid values.
- Tournament formats supported: T20, One Day (50 overs), Test.
- The onboarding flow is a multi-step form. Each step validates before proceeding to the next.

### Gameplay (Match Action)

- Match state drives all UI. The current innings, over number, and ball number are always visible.
- Valid ball outcomes: 0, 1, 2, 3, 4, 6, Wide, No-ball, Bye, Leg-bye, Wicket.
- A wide or no-ball does not count as a legal delivery. The ball count must not increment for these.
- Wicket types: Bowled, Caught, LBW, Run Out, Stumped, Hit Wicket. Always record who took the wicket.
- Over completion triggers automatic bowler rotation UI.
- The target score (in the second innings) must always be displayed prominently.

### Scoreboard

- Always show: current score, wickets, overs, run rate, required run rate (second innings).
- Batting card shows: batsman name, runs, balls faced, 4s, 6s, strike rate.
- Bowling card shows: bowler name, overs, maidens, runs conceded, wickets, economy.
- Fall of wickets must be listed with score and over at which each wicket fell.
- Partnership stats must be shown for the current batting pair.

### Budget Management

- Each team has a fixed budget set at the start of the tournament.
- Player auction: each player has a base price. Teams bid in increments. Highest bid wins.
- Once a player is bought, their cost is deducted from the team remaining budget.
- A team cannot bid beyond their remaining budget.
- Budget overview must show: total budget, amount spent, amount remaining, player count.
- Players can be released back before the tournament starts, returning their cost to the budget.

---

## File Naming Conventions

- React component files: `PascalCase.tsx` (e.g., `ScoreCard.tsx`)
- Utility and helper files: `camelCase.ts` (e.g., `calculateRunRate.ts`)
- Type definition files: `camelCase.types.ts` (e.g., `match.types.ts`)
- Route handler files: always named `route.ts`
- Test files: same name as the file under test with `.test.ts` or `.test.tsx` suffix

---

## State Management

- Server state (match data, team data, scores) is fetched server-side in Server Components or via route handlers.
- Client-side UI state (selected tab, open modal, form step) uses `useState` and `useReducer` locally.
- If cross-component state sharing is needed, use React Context. Create contexts in `src/lib/context/`.
- Do not introduce a third-party state management library without a documented reason.

---

## Accessibility

- Every image must have a meaningful `alt` attribute. Never use `alt=""` unless the image is purely decorative.
- Form fields must have associated `<label>` elements. Never use `placeholder` as the only label.
- Modals and dialogs must trap focus and close on `Escape`.
- Colour alone must not be the only way to convey information (always pair a colour with a text label).

---

## Pre-coding Checklist

Before writing any code, confirm each of the following:

1. Read the relevant section of this file for the domain you are touching.
2. Check `src/components/` for an existing component before building a new one.
3. Check `src/lib/types/` for an existing type before defining a new one.
4. Read `node_modules/next/dist/docs/` for any Next.js API you plan to use.
5. Run `npm run lint` and `npx tsc --noEmit` before considering a task done.
6. Confirm no new arbitrary values (`px-[13px]`, `text-[#abc]`) appear in the diff.
7. Confirm no emoji, double hyphens, or filler text appear in any user-facing string.
