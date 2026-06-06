# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A single-screen "Treasure Hunt" browser game: three chests, one holds treasure (+$100), the others a skeleton (-$50). The game ends when the treasure is found or all chests are opened. This is a Figma Make export scaffolded with Vite + React 18 + TypeScript (SWC).

## Commands

```bash
npm install        # install dependencies
npm run dev:all    # run BOTH the API server (port 4000) and Vite (port 3000) together
npm run dev        # frontend only: Vite dev server on http://localhost:3000
npm run server     # backend only: Node API on port 4000 (node --experimental-sqlite)
npm run build      # production build, output to ./build
```

The login/score feature needs the backend running, so use `npm run dev:all` for full-app development. The `server` script passes `--experimental-sqlite` because the backend uses Node's built-in `node:sqlite` (Node 22.x prints an experimental warning — that's expected).

There are **no test, lint, or typecheck scripts**, no `tsconfig.json`, and no test runner configured. "Check for errors" means relying on the dev server / editor diagnostics, not a CLI command.

## Architecture

- **All game logic lives in `src/App.tsx`** — a single default-export component. State is three `useState` hooks: `boxes` (array of `{ id, isOpen, hasTreasure }`), `score`, and `gameEnded`. `initializeGame()` randomly assigns the treasure and runs once on mount via `useEffect`. There is no router and no other game screen.
- **Entry chain:** `index.html` → `src/main.tsx` (mounts `<App />` into `#root`, imports `src/index.css`) → `src/App.tsx`.
- **Media assets are imported as ES modules**, not referenced by path: images from `src/assets/*.png` and sounds from `src/audios/*.mp3` are `import`ed at the top of `App.tsx` and used as `src` values / `new Audio()` sources.

## Backend & auth (login + high scores)

A small Node/Express API in `server/` provides accounts and per-user high-score persistence:

- **`server/index.js`** — Express routes: `POST /api/signup`, `POST /api/login`, `GET /api/me`, `POST /api/score`.
- **`server/db.js`** — uses Node's built-in `node:sqlite` (`DatabaseSync`) against `game.db` at the repo root (gitignored). Single `users` table; only each user's **highest** score is stored (`high_score` column).
- **`server/auth.js`** — `bcryptjs` password hashing + `jsonwebtoken` JWTs; `authMiddleware` reads `Authorization: Bearer <token>`.

Frontend side: `src/lib/api.ts` (fetch wrapper, stores the JWT in `localStorage`), `src/hooks/useAuth.ts` (session state, restores via `/api/me` on load), and `src/components/AuthScreen.tsx` (login/signup + guest). `src/App.tsx` gates the game behind auth and submits the final score on game over (logged-in users only; guests play without saving). The browser calls relative `/api/*` paths, which Vite proxies to `localhost:4000` (`server.proxy` in `vite.config.ts`) — so no CORS handling is needed.

## Critical: Tailwind CSS is pre-compiled, not built

Tailwind is **not installed and not part of the build** (check `package.json` devDependencies — there is no `tailwindcss` or PostCSS config). The styling works because:

- `src/index.css` (~4600 lines) is a **static, pre-generated Tailwind v4 stylesheet** committed to the repo. This is the only CSS actually loaded (via `main.tsx`).
- `src/styles/globals.css` holds the design tokens / `@theme` source but is **imported nowhere** — editing it has no effect at runtime.

Consequence: **adding a new Tailwind utility class in JSX will silently do nothing if that class is not already present in `src/index.css`.** When a needed utility is missing, either reuse an existing class, add the rule manually to `src/index.css`, or use inline `style={{ }}`. Do not assume an arbitrary Tailwind class will "just work."

## UI component library

`src/components/ui/` contains the full shadcn/ui set (Radix-based) plus `src/components/figma/ImageWithFallback.tsx`. These are scaffolding from the export and are **mostly unused by the game** (`App.tsx` only imports `Button`). Reuse them when building new UI rather than adding new dependencies. `src/components/ui/utils.ts` exports the `cn()` helper (clsx + tailwind-merge).

## Imports and path aliases (`vite.config.ts`)

- `@` resolves to `./src`.
- The config also maps many **version-suffixed module specifiers** (e.g. `sonner@2.0.3` → `sonner`, `@radix-ui/react-dialog@1.1.6` → `@radix-ui/react-dialog`). These exist because the Figma export wrote versioned imports; the shadcn components rely on them. Leave these aliases in place.

## Conventions

- Per the README's project memory note: add a one-line comment on top of every new function summarizing its usage, and document input and output parameters.
- `src/guidelines/Guidelines.md` is a placeholder for project-specific design rules (currently empty/commented).
