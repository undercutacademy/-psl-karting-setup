# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Multi-team karting setup management app. Drivers fill out a setup form (engine, tyres, chassis, etc.) keyed by email; managers see submissions per team in a dashboard with PDF export and per-team configuration. Originally PSL Karting only — now serves multiple teams (PSL, TKG BirelArt, GPM/EmiliaKart, Prime Powerteam, Bravar Sports, HOTZ Driver Development, RPG, Demo) under a single deployment, distinguished by URL slug.

Two halves of the codebase, deployed separately:
- **`frontend/`** — Next.js 16 App Router, React 19, Tailwind v4. Deployed to Netlify (`netlify.toml`). Single page app — every route lives under `app/[teamSlug]/...` so the team slug is part of every URL.
- **`backend/`** — Express 5 + Prisma 5 + Postgres (Supabase). REST API on port 3001 under `/api/*`. The frontend talks to it via `NEXT_PUBLIC_API_URL`.

There is no test suite. Verification = `npm run build` passes on both halves and the feature works in a real browser (and on iPhone for camera-related changes — see `Plans/testing-on-iphone.md`).

## Common commands

Always run from `backend/` or `frontend/` — there is no root `package.json`.

```bash
# Frontend (port 3000)
cd frontend
npm run dev          # next dev
npm run build        # next build — run this to verify TS + lint pass
npm run lint         # eslint

# Backend (port 3001)
cd backend
npm run dev          # nodemon + ts-node, watches src/
npm run build        # prisma generate + tsc
npm run prisma:generate
npm run prisma:migrate    # prisma migrate dev (creates a new migration)
npm run prisma:studio     # GUI for the DB

# Start both at once (Windows)
start_app.bat
# Start both at once (Mac) — kills :3000/:3001 first, runs backend in bg, frontend in fg
./start_app.command
```

The backend has a `postinstall` that runs `prisma generate`, so `npm install` is enough to get a working Prisma client. If you see "PrismaClient has no exported member", run `npx prisma generate` from `backend/`.

**`backend/dist/` is committed to git** (the deploy host runs `node dist/server.js` from the repo). After changing backend source, run `npm run build` from `backend/` and commit the regenerated `dist/` alongside your `src/` changes — otherwise the deployed backend won't pick them up.

## Architecture: the team-slug model

Everything is scoped to a `Team`. The slug is the load-bearing identifier:

- **Frontend route shape** — `app/[teamSlug]/form`, `app/[teamSlug]/manager/dashboard`, etc. The root `app/page.tsx` is a static team-picker; there is no team-less form or dashboard.
- **Team config flows top-down** — `app/[teamSlug]/layout.tsx` server-fetches the team config via `getTeamConfig(slug)` and wraps children in `<TeamConfigProvider>`. Client components read it through `useTeamConfig()` (a thin wrapper around the context). When you need branding, dropdown options, language, custom labels, or enabled/required field lists, get them from this hook — do **not** refetch.
- **Backend resolves the team from the request** — every submissions/users endpoint takes `teamSlug` as a query param (or in the body for POST/PUT). The route does `prisma.team.findUnique({ where: { slug } })` and uses `team.id` for all DB queries. Submissions are isolated by `teamId`.
- **Manager auth is header-based, not JWT** — login returns the user; the frontend stores `managerEmail` + `managerUser` in `localStorage`; subsequent manager API calls send `x-manager-email` (see `lib/api.ts: managerAuthHeaders`). The backend's `requireManager` middleware looks up the user by that header and attaches it to `req.user`. Passwords are SHA-256 in the DB (see `routes/auth.ts: hashPassword`) — not bcrypt; do not "upgrade" this without coordinating data migration.

## Authorization model (read before changing anything in `routes/`)

There are three role bits on `User` (`isManager`, `isOwner`, `isSuperAdmin`) and one team-level toggle (`Team.superuserAccessExpiresAt`). The combination determines access:

- **Manager** of a team → full access to that team's submissions only.
- **Owner** of a team → manager + can add/remove other managers and toggle superuser access (see `requireOwner` in `middleware/auth.ts`).
- **SuperAdmin** → can access *any* team's submissions, **but only if** that team has `superuserAccessExpiresAt` in the future. Otherwise list-only (counts/metadata, no submission detail).

The single function that resolves this is `resolveSubmissionAccess(user, team)` in `backend/src/middleware/auth.ts` returning `'full' | 'list' | 'none'`. Every submissions route calls it. When adding new endpoints that touch submission data, route through this function instead of re-implementing the logic.

The frontend mirrors this: list endpoints return `{ submissions, accessLevel }` and the dashboard hides the "view detail" link when `accessLevel === 'list'`. `SuperuserAccessDisabledError` (in `lib/api.ts`) is thrown for the "you can see it exists but not the contents" case.

## Form configuration is dynamic

The driver form (`frontend/app/[teamSlug]/form/page.tsx`, ~1600 lines) is one giant multi-step form, but which fields appear and which are required is per-team:

- `team.formConfig.enabledFields` / `requiredFields` — JSON arrays in the DB; merged with `DEFAULT_FORM_CONFIG` in `routes/teams.ts` on read. Editing a team's form config goes through `PUT /api/teams/:slug/config`.
- `team.dropdownOptions` — overrides for tracks, championships, divisions, tyre models. Defaults come from `REGION_DROPDOWN_OPTIONS[team.region]` (NorthAmerica, Brazil, CentralAmerica, Europe).
- `team.customLabels` — JSON map of field → display label, applied per-team (e.g. one team renames "Carburator Number" to "Jet Number").
- `team.formConfig.tyreAgeMode` (`'sessions' | 'laps'`) and `tyrePressureMode` (`'lowest' | 'four'`) — toggles in Settings that change form input behavior.
- `Submission.customData` (Json) — for team-specific fields that don't have a dedicated column.

Some fields are gated by **division name pattern**, not config: `SHIFTER_DIVISIONS` swap "Drive/Driven Sprocket" for "Gear Ratio"; `MINI_MICRO_DIVISIONS` hide the front bar and show the front-wheel-type toggle. These lists live at the top of `form/page.tsx`. Adding a new shifter or mini class means updating those arrays.

## Submission lifecycle

1. Driver enters email on `/[teamSlug]/form`. Backend hits `GET /api/submissions/last/:email?teamSlug=...` → returns previous submission for that team (photo stripped to keep response small).
2. If a previous setup exists, frontend asks "has the setup changed?" — yes goes to the full form, no skips to the final step.
3. Submit → `POST /api/submissions` creates/upserts the user (per email per team) and inserts the submission. Email notifications fire via Resend (`services/emailService.ts`) — both confirmation to driver and notification to all addresses in `team.managerEmails`. If a `dashSummaryPhoto` (base64 data URL) is included, it's inlined as a `cid:` image in the manager email and attached to the PDF.
4. Manager opens dashboard → `GET /api/submissions?teamSlug=...` returns the list (photo stripped). Detail view + PDF refetch the photo on demand.

**Weather capture**: on the final form step the client fetches current conditions (temp, humidity, surface pressure) from Open-Meteo using device geolocation (`frontend/lib/weather.ts`). It returns `null` on *any* failure — weather never blocks a submission. The backend range-validates via `normalizeWeatherFields` (`backend/src/lib/weather.ts`): out-of-range values become `null`, absent keys stay absent so PUT doesn't clobber stored values. Weather shows in the detail view, PDF, and manager email — always as labeled name + value + unit, with pressure in **mbar** (numerically identical to the stored hPa).

The dash photo size cap is enforced in two places: the client compresses with `browser-image-compression` to ~300 KB, and the route rejects strings >500 KB with HTTP 413. The body size limit is 1 MB at the Express layer (`server.ts`). If you need to raise the photo limit, raise both the Express limit and `DASH_SUMMARY_PHOTO_MAX_LENGTH`.

## Database & migrations

- Postgres on Supabase. `DATABASE_URL` (pooled) and optional `DIRECT_URL` (direct, for migrations) in `backend/.env`. Production `DATABASE_URL` must use the **transaction pooler (port 6543)** — the session pooler (5432) caps at 15 clients and exhausts under load.
- **One Prisma client for the whole process**: import `prisma` from `backend/src/lib/prisma.ts`. Never `new PrismaClient()` in a route — per-route clients each open a pool and exhaust Supabase's pooler ("max clients reached in session mode" 500s).
- Schema is in `backend/prisma/schema.prisma`. Lots of enums for setup choices (SessionType, ClassCode, Spindle, etc.) — adding a new option means a Prisma migration.
- Migrations are committed under `backend/prisma/migrations/`. Always create new ones with `npx prisma migrate dev --name <description>` rather than editing existing ones.
- Many `backend/src/scripts/*.ts` files are one-off seed/admin tasks (create a team, add tracks to a region, sync managerEmails). Run them with `npx ts-node src/scripts/<name>.ts`. Most are not idempotent — read the script before running.

## Email

Uses **Resend** (`RESEND_API_KEY`), not Nodemailer SMTP, despite what the older `README.md` says. The README's SMTP_USER/SMTP_PASS section is stale documentation — the actual sender is `services/emailService.ts` and it imports `resend`. Outgoing manager emails iterate over `team.managerEmails`; that list is mirrored when managers are added/removed via the team routes.

- The `MANAGER_EMAIL` env var is a **dev-only** fallback notification target. In production only `team.managerEmails` are notified (superadmin addresses are stripped).
- Manager welcome emails are team-branded: team logo, `team.primaryColor` accents, and `team.emailFromName` as the sender name.

## Frontend conventions

- **Tailwind v4** with the new `@tailwindcss/postcss` plugin and CSS-first config (no `tailwind.config.js`). Don't add one.
- **No JS state management library** — all state is `useState` + the `TeamConfigContext`. `localStorage` holds manager auth (`managerEmail`, `managerUser`) and form drafts.
- **Translations** live in `lib/translations.ts` keyed by `Language` (`'en' | 'es' | 'pt' | 'it'`). Selected per team via `team.defaultLanguage`. When adding a user-facing string in the form, add all four translations.
- **Track layouts** (SVG-ish track diagrams shown alongside the form) are in `lib/trackLayouts.ts`, keyed by track name.
- **Image compression** for the dash photo is client-side via `browser-image-compression`; the form handles the spinner state inline.

## Things that look wrong but aren't

- `frontend/app/[teamSlug]/loading.tsx` and `not-found.tsx` exist — Next.js convention. Don't merge them into the layout.
- Backend has a `controllers/` directory that is empty; routes implement handlers inline in `routes/*.ts`. Don't restructure to fix this unless asked.
- `Old database/` at the repo root is archived data, not active code. Ignore it.
- `frontend/convert_webp.py`, `process_glow.py`, `test_glow.py` are one-off image-processing scripts kept around for asset regeneration; they have nothing to do with the running app.
- `backend/server.log` and `server2.log` are gitignored dev logs.

## Where things live (quick map)

| What | Where |
|---|---|
| Driver form (huge multi-step) | [frontend/app/[teamSlug]/form/page.tsx](frontend/app/[teamSlug]/form/page.tsx) |
| Manager dashboard | [frontend/app/[teamSlug]/manager/dashboard/page.tsx](frontend/app/[teamSlug]/manager/dashboard/page.tsx) |
| Per-team settings UI | [frontend/app/[teamSlug]/manager/settings/page.tsx](frontend/app/[teamSlug]/manager/settings/page.tsx) |
| API client (all `fetch` calls) | [frontend/lib/api.ts](frontend/lib/api.ts) |
| Team config provider/hook | [frontend/components/TeamConfigProvider.tsx](frontend/components/TeamConfigProvider.tsx), [frontend/hooks/useTeamConfig.ts](frontend/hooks/useTeamConfig.ts) |
| Express entry | [backend/src/server.ts](backend/src/server.ts) |
| Submission CRUD + enum mappings | [backend/src/routes/submissions.ts](backend/src/routes/submissions.ts) |
| Team CRUD + form-config defaults | [backend/src/routes/teams.ts](backend/src/routes/teams.ts) |
| Manager auth + access resolution | [backend/src/middleware/auth.ts](backend/src/middleware/auth.ts) |
| Email (Resend) + PDF rendering | [backend/src/services/emailService.ts](backend/src/services/emailService.ts), [backend/src/services/pdfService.ts](backend/src/services/pdfService.ts) |
| Shared Prisma client | [backend/src/lib/prisma.ts](backend/src/lib/prisma.ts) |
| Weather fetch (client) / validation + formatters (server) | [frontend/lib/weather.ts](frontend/lib/weather.ts), [backend/src/lib/weather.ts](backend/src/lib/weather.ts) |
| Schema + migrations | [backend/prisma/schema.prisma](backend/prisma/schema.prisma), [backend/prisma/migrations/](backend/prisma/migrations/) |
| iPhone testing guide | [Plans/testing-on-iphone.md](Plans/testing-on-iphone.md) |
