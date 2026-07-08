# Driver Role — Design Spec

**Date:** 2026-07-08
**Status:** Approved by Lucas (via brainstorming Q&A)

## Goal

Add a second dashboard user type, **Driver**, alongside Manager. A driver logs in to the
existing team dashboard with their own email + password and can view and edit **only their
own setups**. Drivers cannot delete setups, cannot download PDFs, cannot see other drivers'
setups, and never receive setup notification emails. Managers add and remove driver accounts
from the dashboard; removing a driver immediately revokes their access while keeping all
their submissions visible to managers.

## Decisions made during brainstorming

| Question | Decision |
|---|---|
| Credential delivery | Team-branded welcome email with generated temp password + forced password change on first login (same flow as managers) |
| Login & pages | Reuse the existing `/[teamSlug]/manager/login` and dashboard pages; UI adapts by role |
| Emails | Drivers are never added to notification lists (no manager-style emails). The existing submission-confirmation email to form users is **unchanged** |
| Who manages drivers | Any manager of the team (not owner-only, unlike manager management) |

## Data model

One migration on `User`:

```prisma
isDriver Boolean @default(false)
```

No other schema change. Drivers reuse the existing `password`, `mustChangePassword`,
`teamId`, and `submissions` relation — a driver is usually a `User` row that already exists
from a form submission.

## Backend

### Auth (`backend/src/middleware/auth.ts`)

- `AuthRequest.user` gains `isDriver: boolean`.
- `SubmissionAccessLevel` gains a fourth value: `'own'`.
- `resolveSubmissionAccess(user, team)` returns `'own'` when
  `user.isDriver && !user.isManager && user.teamId === team.id`.
  Manager and superadmin logic unchanged.
- New middleware `requireDashboardUser`: accepts users with `isManager || isDriver`
  (still via the `x-manager-email` header). `requireManager` stays strict and keeps
  guarding manager-only routes.
- Because middleware re-reads the user on every request, clearing `isDriver` revokes
  access on the driver's very next API call.

### Login (`backend/src/routes/auth.ts`)

- `POST /manager/login` accepts `isManager || isDriver` users. Response includes
  `isDriver`. Team check for drivers is the same as for non-superadmin managers
  (`teamId` must match).
- `PUT /manager/change-password` switches from `requireManager` to
  `requireDashboardUser` so first-login password change works for drivers.

### Submissions (`backend/src/routes/submissions.ts`)

Behavior at access level `'own'`:

- **List** (`GET /api/submissions?teamSlug=`): only submissions with
  `userId === req.user.id`; response `accessLevel: 'own'`.
- **Detail** (`GET /:id`) and **edit** (`PUT /:id`): allowed only when the submission
  belongs to the driver; otherwise 403.
- **Delete** (`DELETE /:id`) and **PDF** endpoints: require `'full'` — drivers get 403.
  Server-enforced, not just hidden buttons.
- Routes currently guarded by `requireManager` that drivers need switch to
  `requireDashboardUser` + access-level checks.

### Driver management (`backend/src/routes/teams.ts`)

New endpoints, all guarded by `requireManager` only (any team manager):

- `POST /:slug/drivers` — body `{ email, firstName, lastName }`. Find-or-create the
  `User` by email; set `isDriver: true`, generate temp password, set
  `mustChangePassword: true`, send driver-worded team-branded welcome email.
  Rejections: email belongs to a different team (403/409); email is already a manager
  of any team (409). If the user exists with no `teamId`, link to this team.
- `GET /:slug/drivers` — list `{ id, email, firstName, lastName, createdAt }` of team
  users with `isDriver: true`.
- `DELETE /:slug/drivers/:userId` — clear `isDriver` and `password`
  (+ `mustChangePassword`). The `User` row and all submissions are kept; managers keep
  full visibility. Only revokes login.
- `POST /:slug/drivers/:userId/resend-access` — regenerate temp password, resend
  welcome email (mirror of the manager resend-access flow).

Drivers are **never** written to `team.managerEmails` — that is the mechanism that
guarantees they receive no setup notification emails.

### Email (`backend/src/services/emailService.ts`)

Reuse the manager welcome email with driver wording (parameterize the role/intro line).
No other email change.

## Frontend

- **`lib/api.ts`**: `SubmissionAccessLevel` gains `'own'`; login result and stored
  `managerUser` gain `isDriver`; new functions `addTeamDriver`, `listTeamDrivers`,
  `deleteTeamDriver`, `resendDriverAccess`.
- **Login page**: unchanged UI; stores `isDriver` from the response. Removed drivers
  simply fail login.
- **Dashboard** (`manager/dashboard/page.tsx`): at `accessLevel === 'own'` — list shows
  only the driver's setups (server-filtered anyway); hide Settings link, Delete buttons,
  and PDF export; keep View + Edit. On 403 from an API call, clear stored auth and
  redirect to login (covers mid-session removal).
- **Submission detail/edit pages**: same pages; hide PDF/delete for drivers.
- **Settings page**: new **Drivers** section visible to *all* managers (Managers section
  stays owner-only): add driver (email/first/last), list, remove (confirm dialog),
  resend access. Not rendered for drivers (they can't reach settings at all).
- **Translations**: all new UI strings added to `lib/translations.ts` in en/es/pt/it.

## Edge cases

- Driver opens another driver's submission URL → 403 page/redirect.
- Driver removed mid-session → next API call 403 → bounced to login.
- Driver added with an email that has never submitted → `User` created linked to the
  team; future form submissions with that email appear in his dashboard automatically.
- Driver submits the form normally → managers get notified as usual; the driver's own
  confirmation email behaves exactly as today.
- Adding a driver who is already a driver → idempotent-ish: reject with a clear
  "already a driver" message (use resend-access instead).

## Out of scope

- No separate driver URL area, no role enum refactor, no bcrypt upgrade, no changes to
  the driver form flow or confirmation emails, no driver self-registration.

## Verification

`npm run build` in both `frontend/` and `backend/`; rebuild and commit `backend/dist/`.
Browser pass: add driver → welcome email arrives → login → forced password change →
dashboard shows only own setups → edit works → no PDF/delete/settings → remove driver →
next request bounces to login and re-login fails.
