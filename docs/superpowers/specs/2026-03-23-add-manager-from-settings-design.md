# Add Manager from Team Settings — Design Spec

## Overview

Allow the superadmin (`overcutacademy@gmail.com`) to add new managers to any team directly from that team's settings page. Auto-generates a password, sends a welcome email with credentials via Resend, and requires the new manager to change their password on first login.

## Requirements

- Only the superadmin (`isSuperAdmin: true`) can see and use this feature
- Existing managers are completely unaffected
- New managers receive a welcome email with auto-generated credentials
- New managers must change their password on first login before accessing the dashboard
- The new manager's email is automatically added to the team's `managerEmails[]` for submission notifications

## Design

### 1. Database Changes

Add one field to the `User` model in Prisma:

```prisma
mustChangePassword  Boolean  @default(false)
```

- Defaults to `false` — all existing managers unaffected
- Set to `true` only when a manager is created via the new settings form
- Flipped to `false` after the manager changes their password on first login

### 2. Backend — New API Endpoints

#### POST `/api/teams/:slug/managers`

**Purpose:** Create a new manager for a team.

**Access:** Uses `requireManager` middleware (via `x-manager-email` header). Handler then verifies `isSuperAdmin: true` on the authenticated user. The `requireManager` middleware must be updated to include `isSuperAdmin` in the `AuthRequest.user` object.

**Request body:**
```json
{
  "email": "string",
  "firstName": "string",
  "lastName": "string"
}
```

**Logic:**
1. Validate the email isn't already registered in the system (if it is, return 409 with a message explaining the email is already in use — the manager may exist on another team)
2. Auto-generate an 8-character random password using `crypto.randomBytes(6).toString('base64url').slice(0, 8)` for cryptographic randomness
3. Hash the password with SHA-256 (matching existing auth pattern)
4. **In a Prisma `$transaction`:** Create the `User` record and append email to team's `managerEmails[]` atomically:
   - Create `User` with: `email`, `firstName`, `lastName`, `password` (hashed), `isManager: true`, `isSuperAdmin: false`, `mustChangePassword: true`, `teamId` (from slug lookup)
   - Update team: push email to `managerEmails[]`
5. Send welcome email via Resend with the plain-text password and login link
6. If email send fails, still return success with warning: `{ success: true, message: "Manager created but welcome email failed to send" }`
7. On full success: `{ success: true, message: "Manager added successfully" }` (never return the password)

**Error cases:**
- 404: Team not found
- 403: Requesting user is not a superadmin
- 409: Email already registered (may exist on another team)

#### PUT `/api/auth/manager/change-password`

**Purpose:** Allow a manager to change their password.

**Access:** Uses `requireManager` middleware. The `x-manager-email` header must match the `email` in the request body (prevents one manager from changing another's password).

**Request body:**
```json
{
  "email": "string",
  "currentPassword": "string",
  "newPassword": "string"
}
```

**Logic:**
1. Verify `x-manager-email` header matches request body `email`
2. Find the user by email
3. Verify the current password (SHA-256 hash comparison)
4. Validate new password: minimum 8 characters, must differ from current password
5. Hash the new password and update the user record
6. Set `mustChangePassword: false`
7. Return `{ success: true }`

**Error cases:**
- 403: Header email does not match request email
- 404: User not found
- 401: Current password incorrect
- 400: New password too short or same as current password

#### Modify existing: POST `/api/auth/manager/login`

Add `mustChangePassword` to the login response object so the frontend can check the flag:

```json
{
  "success": true,
  "user": {
    "id": "...",
    "email": "...",
    "firstName": "...",
    "lastName": "...",
    "isSuperAdmin": true,
    "teamId": "...",
    "mustChangePassword": false
  }
}
```

### 3. Frontend — Settings Page Addition

**Location:** Bottom of existing settings page at `/[teamSlug]/manager/settings/page.tsx`

**Visibility:** Only rendered when the logged-in user has `isSuperAdmin: true` (checked from `managerUser` in localStorage).

**UI:**
- Section header: "Add Manager" (or similar)
- Three input fields: First Name, Last Name, Email
- Submit button styled with team's primary color
- Loading state on submit
- Success message showing "Manager added! Welcome email sent to {email}"
- Error message for duplicate emails or failures
- Styled consistently with existing settings page cards

**API calls:** New frontend API functions must include the `x-manager-email` header from `localStorage.getItem('managerEmail')`. This is critical — existing API functions in `frontend/lib/api.ts` do not all include this header.

### 4. Frontend — First Login Password Change

**New page:** `/[teamSlug]/manager/change-password/page.tsx`

**Flow:**
1. After login, if `user.mustChangePassword === true`, redirect to this page
2. The manager layout guard (`layout.tsx`) checks this flag and blocks access to dashboard/settings until password is changed

**Layout guard logic (in `layout.tsx`):**
- If `pathname` is the change-password page → render children without nav bar (like login page)
- If `managerUser.mustChangePassword === true` AND `pathname` is NOT change-password → redirect to change-password
- Otherwise → proceed as normal (existing behavior)

This prevents infinite redirect loops between the layout guard and the change-password page.

**UI:**
- Current Password field
- New Password field (min 8 characters)
- Confirm New Password field
- Submit button
- Validation: passwords must match, min 8 chars, must differ from current
- On success: updates localStorage user object (`mustChangePassword: false`), redirects to dashboard

**API call:** Must include `x-manager-email` header from localStorage.

### 5. Welcome Email

**Sent via:** Resend API

**From:** `setup@overcutacademy.com`

**Template (HTML with plain-text style):**

```
Welcome to setups.overcutacademy.com!

Here are your credentials:

Email: {managerEmail}
Password: {autoGeneratedPassword}

Click here to login and create your own password:
https://setups.overcutacademy.com/{teamSlug}/manager/login

Lucas Nogueira — Founder
[Overcut Academy logo]
www.overcutacademy.com
```

## Files to Modify

### Backend
- `backend/prisma/schema.prisma` — Add `mustChangePassword` field to User model
- `backend/src/middleware/auth.ts` — Update `requireManager` middleware and `AuthRequest` interface to include `isSuperAdmin` in user object
- `backend/src/routes/teams.ts` — Add POST `/:slug/managers` endpoint (with `requireManager` + superadmin check)
- `backend/src/routes/auth.ts` — Add PUT `/manager/change-password` endpoint (with `requireManager`), add `mustChangePassword` to login response
- `backend/src/services/emailService.ts` — Add `sendManagerWelcomeEmail()` function

### Frontend
- `frontend/app/[teamSlug]/manager/settings/page.tsx` — Add "Add Manager" section (superadmin only)
- `frontend/app/[teamSlug]/manager/change-password/page.tsx` — New page for first-login password change
- `frontend/app/[teamSlug]/manager/layout.tsx` — Add redirect logic for `mustChangePassword`, exempt change-password path from nav/redirect
- `frontend/lib/api.ts` — Add API client functions for new endpoints (must include `x-manager-email` header)
- `frontend/types/submission.ts` — Add `isSuperAdmin` and `mustChangePassword` to the `User` interface

### Database
- Run `npx prisma migrate` after schema change
