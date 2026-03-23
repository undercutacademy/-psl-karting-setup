# Add Manager from Team Settings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow the superadmin to add new managers to any team from that team's settings page, with auto-generated passwords, welcome emails, and forced password change on first login.

**Architecture:** New backend endpoints on existing routes (teams + auth), a new welcome email function in the email service, a new "Add Manager" section on the settings page (superadmin-only), and a new change-password page with a layout guard that enforces password change before dashboard access.

**Tech Stack:** Prisma (schema migration), Express (API endpoints), Resend (email), Next.js/React (frontend pages), SHA-256 (password hashing, matching existing pattern)

**Spec:** `docs/superpowers/specs/2026-03-23-add-manager-from-settings-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/prisma/schema.prisma` | Modify | Add `mustChangePassword` field to User model |
| `backend/src/middleware/auth.ts` | Modify | Add `isSuperAdmin` to `AuthRequest.user` interface and middleware |
| `backend/src/routes/teams.ts` | Modify | Add `POST /:slug/managers` endpoint |
| `backend/src/routes/auth.ts` | Modify | Add `mustChangePassword` to login response, add `PUT /manager/change-password` endpoint |
| `backend/src/services/emailService.ts` | Modify | Add `sendManagerWelcomeEmail()` function |
| `frontend/types/submission.ts` | Modify | Add `isSuperAdmin` and `mustChangePassword` to `User` interface |
| `frontend/lib/api.ts` | Modify | Add `addTeamManager()` and `changePassword()` API functions |
| `frontend/app/[teamSlug]/manager/layout.tsx` | Modify | Add change-password redirect guard |
| `frontend/app/[teamSlug]/manager/login/page.tsx` | Modify | Check `mustChangePassword` after login, redirect if needed |
| `frontend/app/[teamSlug]/manager/settings/page.tsx` | Modify | Add "Add Manager" section (superadmin-only) |
| `frontend/app/[teamSlug]/manager/change-password/page.tsx` | Create | New page for first-login password change |

---

### Task 1: Prisma Schema — Add `mustChangePassword` to User

**Files:**
- Modify: `backend/prisma/schema.prisma:92-105`

- [ ] **Step 1: Add the field to the User model**

In `backend/prisma/schema.prisma`, add `mustChangePassword` field after line 99 (`isSuperAdmin`):

```prisma
  mustChangePassword Boolean @default(false)
```

The full User model should look like:
```prisma
model User {
  id                 String       @id @default(uuid())
  email              String       @unique
  firstName          String
  lastName           String
  password           String?      // Only for managers
  isManager          Boolean      @default(false)
  isSuperAdmin       Boolean      @default(false)  // Can access all team dashboards
  mustChangePassword Boolean      @default(false)
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  submissions        Submission[]
  teamId             String?
  team               Team?        @relation(fields: [teamId], references: [id])
}
```

- [ ] **Step 2: Generate and apply the migration**

Run from `backend/` directory:
```bash
npx prisma migrate dev --name add-must-change-password
```

Expected: Migration created and applied, Prisma Client regenerated.

- [ ] **Step 3: Commit**

```bash
git add backend/prisma/
git commit -m "feat: add mustChangePassword field to User model"
```

---

### Task 2: Backend — Update Auth Middleware

**Files:**
- Modify: `backend/src/middleware/auth.ts:6-11` (AuthRequest interface)
- Modify: `backend/src/middleware/auth.ts:36-40` (req.user assignment)

- [ ] **Step 1: Update the `AuthRequest` interface to include `isSuperAdmin`**

In `backend/src/middleware/auth.ts`, change the `user` type in the interface:

```typescript
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isManager: boolean;
    isSuperAdmin: boolean;
  };
}
```

- [ ] **Step 2: Update `requireManager` to populate `isSuperAdmin`**

In the same file, update the `req.user` assignment (around line 36):

```typescript
    req.user = {
      id: user.id,
      email: user.email,
      isManager: user.isManager,
      isSuperAdmin: user.isSuperAdmin,
    };
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/middleware/auth.ts
git commit -m "feat: add isSuperAdmin to auth middleware user object"
```

---

### Task 3: Backend — Welcome Email Function

**Files:**
- Modify: `backend/src/services/emailService.ts`

- [ ] **Step 1: Add `sendManagerWelcomeEmail` function**

Add this function at the end of `backend/src/services/emailService.ts` (before the final blank line):

```typescript
// Send welcome email to a newly created manager
export async function sendManagerWelcomeEmail(
  managerEmail: string,
  password: string,
  teamSlug: string,
  teamName: string
): Promise<void> {
  console.log(`Sending welcome email to new manager: ${managerEmail}`);

  if (!resend) {
    console.error('Resend not initialized. RESEND_API_KEY is missing.');
    throw new Error('Email service not configured');
  }

  const loginUrl = `https://setups.overcutacademy.com/${teamSlug}/manager/login`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
      <p style="font-size: 16px; margin-bottom: 20px;">Welcome to <strong>setups.overcutacademy.com</strong>!</p>

      <p style="font-size: 14px; margin-bottom: 5px;">Here are your credentials:</p>

      <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> ${managerEmail}</p>
        <p style="margin: 4px 0; font-size: 14px;"><strong>Password:</strong> ${password}</p>
      </div>

      <p style="margin: 20px 0;">
        <a href="${loginUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Click here to login and create your own password
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />

      <p style="font-size: 14px; margin-bottom: 4px;"><strong>Lucas Nogueira</strong> — Founder</p>
      <img src="https://setups.overcutacademy.com/overcut-logo.png" alt="Overcut Academy" style="height: 40px; margin: 8px 0;" />
      <p style="font-size: 12px; color: #6b7280;">www.overcutacademy.com</p>
    </div>
  `;

  try {
    const cleanEmail = managerEmail.trim().toLowerCase();

    const { data, error } = await resend.emails.send({
      from: `Overcut Academy <setup@overcutacademy.com>`,
      to: cleanEmail,
      subject: `Welcome to ${teamName} Setups — Your Manager Credentials`,
      html: htmlContent,
    });

    if (error) {
      console.error(`Resend error sending welcome email to ${cleanEmail}:`, error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }

    console.log(`Welcome email sent successfully to ${cleanEmail}! ID: ${data?.id}`);
  } catch (error) {
    console.error(`Error in sendManagerWelcomeEmail for ${managerEmail}:`, error);
    throw error;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/emailService.ts
git commit -m "feat: add sendManagerWelcomeEmail function"
```

---

### Task 4: Backend — Add Manager Endpoint on Teams Route

**Files:**
- Modify: `backend/src/routes/teams.ts`

- [ ] **Step 1: Add imports at the top of `backend/src/routes/teams.ts`**

After line 2 (`import { PrismaClient } from '@prisma/client';`), add:

```typescript
import crypto from 'crypto';
import { requireManager, AuthRequest } from '../middleware/auth';
import { sendManagerWelcomeEmail } from '../services/emailService';
```

- [ ] **Step 2: Add the POST `/:slug/managers` endpoint**

Add this before the `export default router;` line at the end of `backend/src/routes/teams.ts`:

```typescript
// Add a new manager to a team (superadmin only)
router.post('/:slug/managers', requireManager, async (req: AuthRequest, res) => {
    try {
        // Verify superadmin access
        if (!req.user?.isSuperAdmin) {
            return res.status(403).json({ error: 'Only super admins can add managers' });
        }

        const { slug } = req.params;
        const { email, firstName, lastName } = req.body;

        if (!email || !firstName || !lastName) {
            return res.status(400).json({ error: 'Email, first name, and last name are required' });
        }

        // Check if team exists
        const team = await prisma.team.findUnique({ where: { slug } });
        if (!team) {
            return res.status(404).json({ error: 'Team not found' });
        }

        // Check if email is already registered
        const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existingUser) {
            return res.status(409).json({ error: 'This email is already registered. The manager may exist on another team.' });
        }

        // Generate random 8-character password
        const plainPassword = crypto.randomBytes(6).toString('base64url').slice(0, 8);
        const hashedPassword = crypto.createHash('sha256').update(plainPassword).digest('hex');

        // Create user and update team managerEmails atomically
        const [newUser] = await prisma.$transaction([
            prisma.user.create({
                data: {
                    email: email.trim().toLowerCase(),
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    password: hashedPassword,
                    isManager: true,
                    isSuperAdmin: false,
                    mustChangePassword: true,
                    teamId: team.id,
                },
            }),
            prisma.team.update({
                where: { slug },
                data: {
                    managerEmails: {
                        push: email.trim().toLowerCase(),
                    },
                },
            }),
        ]);

        // Send welcome email (fire-and-forget, don't fail the request)
        let emailWarning = '';
        try {
            await sendManagerWelcomeEmail(email.trim().toLowerCase(), plainPassword, slug, team.name);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            emailWarning = ' (welcome email failed to send)';
        }

        res.status(201).json({
            success: true,
            message: `Manager added successfully${emailWarning}`,
            manager: {
                id: newUser.id,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
            },
        });
    } catch (error) {
        console.error('Error adding manager:', error);
        res.status(500).json({ error: 'Failed to add manager' });
    }
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/teams.ts
git commit -m "feat: add POST /:slug/managers endpoint for superadmin"
```

---

### Task 5: Backend — Login Response + Change Password Endpoint

**Files:**
- Modify: `backend/src/routes/auth.ts:60-70` (login response)
- Modify: `backend/src/routes/auth.ts` (add new endpoint)

- [ ] **Step 1: Add `mustChangePassword` to the login response**

In `backend/src/routes/auth.ts`, update the response object at line 60-70:

Replace:
```typescript
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        teamId: user.teamId,
      },
    });
```

With:
```typescript
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isSuperAdmin: user.isSuperAdmin,
        teamId: user.teamId,
        mustChangePassword: user.mustChangePassword,
      },
    });
```

- [ ] **Step 2: Add the change-password endpoint**

Add this import at the top of `backend/src/routes/auth.ts`, after `import crypto from 'crypto';`:

```typescript
import { requireManager, AuthRequest } from '../middleware/auth';
```

Then add this endpoint before `export default router;`:

```typescript
// Change password (for first-login password change and general use)
router.put('/manager/change-password', requireManager, async (req: AuthRequest, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Email, current password, and new password are required' });
    }

    // Verify the requesting user matches the email
    if (req.user?.email !== email) {
      return res.status(403).json({ error: 'You can only change your own password' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    if (!user.password || !verifyPassword(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Check new password differs from current
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Update password and clear mustChangePassword flag
    await prisma.user.update({
      where: { email },
      data: {
        password: hashPassword(newPassword),
        mustChangePassword: false,
      },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routes/auth.ts
git commit -m "feat: add mustChangePassword to login response and change-password endpoint"
```

---

### Task 6: Frontend — Update Types and API Client

**Files:**
- Modify: `frontend/types/submission.ts:123-129`
- Modify: `frontend/lib/api.ts`

- [ ] **Step 1: Add new fields to the `User` interface**

In `frontend/types/submission.ts`, update the `User` interface:

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;
  isSuperAdmin?: boolean;
  mustChangePassword?: boolean;
}
```

- [ ] **Step 2: Add API functions to `frontend/lib/api.ts`**

Add these two functions at the end of `frontend/lib/api.ts`:

```typescript
export async function addTeamManager(
  teamSlug: string,
  managerData: { email: string; firstName: string; lastName: string }
): Promise<{ success: boolean; message: string; manager?: { id: string; email: string; firstName: string; lastName: string } }> {
  const managerEmail = localStorage.getItem('managerEmail');
  const response = await fetch(`${API_URL}/teams/${encodeURIComponent(teamSlug)}/managers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-manager-email': managerEmail || '',
    },
    body: JSON.stringify(managerData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add manager');
  }
  return data;
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  const managerEmail = localStorage.getItem('managerEmail');
  const response = await fetch(`${API_URL}/auth/manager/change-password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-manager-email': managerEmail || '',
    },
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Failed to change password');
  }
  return data;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/types/submission.ts frontend/lib/api.ts
git commit -m "feat: add User type fields and API functions for manager management"
```

---

### Task 7: Frontend — Login Page Redirect for `mustChangePassword`

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/login/page.tsx:68-72`

- [ ] **Step 1: Update the login handler to check `mustChangePassword`**

In `frontend/app/[teamSlug]/manager/login/page.tsx`, replace lines 68-72:

Replace:
```typescript
      const data = await response.json();
      localStorage.setItem('managerEmail', email);
      localStorage.setItem('managerUser', JSON.stringify(data.user));

      router.push(`/${teamSlug}/manager/dashboard`);
```

With:
```typescript
      const data = await response.json();
      localStorage.setItem('managerEmail', email);
      localStorage.setItem('managerUser', JSON.stringify(data.user));

      if (data.user.mustChangePassword) {
        router.push(`/${teamSlug}/manager/change-password`);
      } else {
        router.push(`/${teamSlug}/manager/dashboard`);
      }
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/[teamSlug]/manager/login/page.tsx
git commit -m "feat: redirect to change-password on first login"
```

---

### Task 8: Frontend — Layout Guard for `mustChangePassword`

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/layout.tsx:22-39`

- [ ] **Step 1: Update the layout auth check**

In `frontend/app/[teamSlug]/manager/layout.tsx`, add the change-password path constant after the `loginPath` declaration (line 23):

```typescript
  const changePasswordPath = `/${teamSlug}/manager/change-password`;
```

Then update the `useEffect` block (lines 25-39) to handle the `mustChangePassword` redirect:

Replace the existing useEffect:
```typescript
  useEffect(() => {
    const managerEmail = localStorage.getItem('managerEmail');
    const managerUser = localStorage.getItem('managerUser');

    if (!managerEmail || !managerUser) {
      if (pathname !== loginPath) {
        router.push(loginPath);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router, pathname, loginPath]);
```

With:
```typescript
  useEffect(() => {
    const managerEmail = localStorage.getItem('managerEmail');
    const managerUserStr = localStorage.getItem('managerUser');

    if (!managerEmail || !managerUserStr) {
      if (pathname !== loginPath) {
        router.push(loginPath);
      } else {
        setIsAuthenticated(false);
        setLoading(false);
      }
    } else {
      // Check if user must change password
      try {
        const managerUser = JSON.parse(managerUserStr);
        if (managerUser.mustChangePassword && pathname !== changePasswordPath) {
          router.push(changePasswordPath);
          return;
        }
      } catch {}
      setIsAuthenticated(true);
      setLoading(false);
    }
  }, [router, pathname, loginPath, changePasswordPath]);
```

- [ ] **Step 2: Render change-password page without nav bar (like login)**

In the same file, update the condition at line 63 that checks for the login path to also include the change-password path:

Replace:
```typescript
  if (pathname === loginPath) {
    return <>{children}</>;
  }
```

With:
```typescript
  if (pathname === loginPath || pathname === changePasswordPath) {
    return <>{children}</>;
  }
```

- [ ] **Step 3: Commit**

```bash
git add frontend/app/[teamSlug]/manager/layout.tsx
git commit -m "feat: add layout guard for mustChangePassword redirect"
```

---

### Task 9: Frontend — Change Password Page

**Files:**
- Create: `frontend/app/[teamSlug]/manager/change-password/page.tsx`

- [ ] **Step 1: Create the change-password page**

Create file `frontend/app/[teamSlug]/manager/change-password/page.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { changePassword } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function ChangePasswordPage() {
  const router = useRouter();
  const params = useParams();
  const teamSlug = params.teamSlug as string;
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [teamLogo, setTeamLogo] = useState('');
  const [teamName, setTeamName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#ef4444');

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch(`${API_URL}/teams/${teamSlug}`);
        if (response.ok) {
          const data = await response.json();
          setTeamLogo(data.logoUrl);
          setTeamName(data.name);
          if (data.primaryColor) setPrimaryColor(data.primaryColor);
        }
      } catch (error) {
        console.error('Error fetching team:', error);
      }
    };

    if (teamSlug) fetchTeam();
  }, [teamSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      const email = localStorage.getItem('managerEmail');
      if (!email) {
        router.push(`/${teamSlug}/manager/login`);
        return;
      }

      await changePassword(email, currentPassword, newPassword);

      // Update localStorage to reflect password changed
      const userStr = localStorage.getItem('managerUser');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.mustChangePassword = false;
        localStorage.setItem('managerUser', JSON.stringify(user));
      }

      router.push(`/${teamSlug}/manager/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden p-8">
      {/* Racing stripes background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 left-1/4 ml-4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 right-1/4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
        <div className="absolute top-0 right-1/4 mr-4 w-1 h-full transform -skew-x-12" style={{ backgroundColor: primaryColor }}></div>
      </div>

      {/* Top racing stripe */}
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ background: `linear-gradient(to right, ${primaryColor}, white, ${primaryColor})` }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          {teamLogo ? (
            <Image
              src={teamLogo}
              alt={teamName || 'Team Logo'}
              width={250}
              height={100}
              className="drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] mb-4"
              style={{ filter: `drop-shadow(0 0 15px ${primaryColor}4D)` }}
              priority
            />
          ) : (
            <div className="h-24 w-64 bg-gray-800/50 rounded animate-pulse mb-4"></div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl bg-gray-900/80 border border-gray-800 p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}33` }}
            >
              <span className="text-2xl">🔑</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white uppercase tracking-wider">
                Change <span style={{ color: primaryColor }}>Password</span>
              </h1>
              <p className="text-gray-400 text-sm">Create your own password to continue</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div
                className="rounded-xl border p-4 text-red-400"
                style={{ backgroundColor: `${primaryColor}1A`, borderColor: `${primaryColor}4D` }}
              >
                {error}
              </div>
            )}

            <div>
              <label htmlFor="currentPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Enter password from email"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Min. 8 characters"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 backdrop-blur-sm transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-6 py-4 font-bold text-white uppercase tracking-wider transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: primaryColor }}
            >
              {loading && (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              )}
              {loading ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-600 text-xs">
          <p>Powered by <a href="https://overcutacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white transition-colors">Overcut Academy</a></p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/app/[teamSlug]/manager/change-password/page.tsx
git commit -m "feat: add change-password page for first-login flow"
```

---

### Task 10: Frontend — Add Manager Section in Settings Page

**Files:**
- Modify: `frontend/app/[teamSlug]/manager/settings/page.tsx`

- [ ] **Step 1: Add import for the new API function**

In `frontend/app/[teamSlug]/manager/settings/page.tsx`, update the import at line 5:

Replace:
```typescript
import { getTeamConfig, updateTeamConfig } from '@/lib/api';
```

With:
```typescript
import { getTeamConfig, updateTeamConfig, addTeamManager } from '@/lib/api';
```

- [ ] **Step 2: Add state for the Add Manager form and superadmin check**

Inside the `ManagerSettings` component, after the existing state declarations (after line 25, `const [lang, setLang] = ...`), add:

```typescript
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [newManagerEmail, setNewManagerEmail] = useState('');
    const [newManagerFirstName, setNewManagerFirstName] = useState('');
    const [newManagerLastName, setNewManagerLastName] = useState('');
    const [addingManager, setAddingManager] = useState(false);
    const [addManagerMessage, setAddManagerMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('managerUser');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setIsSuperAdmin(user.isSuperAdmin === true);
            } catch {}
        }
    }, []);

    const handleAddManager = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddingManager(true);
        setAddManagerMessage(null);

        try {
            const result = await addTeamManager(teamSlug, {
                email: newManagerEmail,
                firstName: newManagerFirstName,
                lastName: newManagerLastName,
            });
            setAddManagerMessage({ type: 'success', text: result.message });
            setNewManagerEmail('');
            setNewManagerFirstName('');
            setNewManagerLastName('');
        } catch (err: any) {
            setAddManagerMessage({ type: 'error', text: err.message || 'Failed to add manager' });
        } finally {
            setAddingManager(false);
        }
    };
```

- [ ] **Step 3: Add the "Add Manager" UI section**

In the same file, add the Add Manager section after the closing `</div>` of the form builder card (after the `</div>` that closes `rounded-2xl bg-gray-900/80`) and before the final two closing `</div>` tags. This is right after line 328 (`</div>` that closes the main card).

Add this JSX:

```tsx
                {/* Add Manager Section - SuperAdmin Only */}
                {isSuperAdmin && (
                    <div className="mt-8 rounded-2xl bg-gray-900/80 border border-gray-800 shadow-xl backdrop-blur-xl p-6 sm:p-8">
                        <h2 className="text-xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                            <span>👤</span> Add Manager
                        </h2>
                        <p className="text-gray-400 mb-6 text-sm">
                            Add a new manager to this team. They will receive an email with auto-generated credentials and must change their password on first login.
                        </p>

                        {addManagerMessage && (
                            <div
                                className={`rounded-xl border p-4 mb-6 ${addManagerMessage.type === 'success' ? 'text-green-400 bg-green-500/10 border-green-500/30' : 'text-red-400 bg-red-500/10 border-red-500/30'}`}
                            >
                                {addManagerMessage.text}
                            </div>
                        )}

                        <form onSubmit={handleAddManager} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newManagerFirstName}
                                        onChange={(e) => setNewManagerFirstName(e.target.value)}
                                        required
                                        className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newManagerLastName}
                                        onChange={(e) => setNewManagerLastName(e.target.value)}
                                        required
                                        className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={newManagerEmail}
                                    onChange={(e) => setNewManagerEmail(e.target.value)}
                                    required
                                    className="block w-full rounded-lg border-2 border-gray-700 bg-gray-800/50 px-4 py-3 text-white placeholder-gray-500 transition-all focus:outline-none focus:ring-2 hover:border-gray-600"
                                    placeholder="manager@example.com"
                                />
                            </div>
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={addingManager}
                                    className="rounded-lg px-8 py-3 font-bold text-white uppercase tracking-wider transition-all hover:opacity-90 shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    style={{ backgroundColor: primaryColor, boxShadow: `0 4px 14px ${primaryColor}4D` }}
                                >
                                    {addingManager && (
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    )}
                                    {addingManager ? 'Adding...' : 'Add Manager'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/[teamSlug]/manager/settings/page.tsx
git commit -m "feat: add superadmin-only Add Manager section to settings page"
```

---

### Task 11: Verify and Test

- [ ] **Step 1: Start the backend server and verify it compiles**

```bash
cd backend && npm run dev
```

Expected: Server starts without TypeScript errors.

- [ ] **Step 2: Start the frontend and verify it compiles**

```bash
cd frontend && npm run dev
```

Expected: Next.js builds without errors.

- [ ] **Step 3: Test the full flow manually**

1. Login as superadmin (`overcutacademy@gmail.com`) at any team's login page
2. Navigate to Settings
3. Verify the "Add Manager" section appears at the bottom
4. Fill in a test manager's details and submit
5. Verify the success message
6. Check the email was received (or check Resend dashboard)
7. Login as the new manager — verify redirect to change-password page
8. Change the password — verify redirect to dashboard
9. Login again as the new manager with the new password — verify goes straight to dashboard

- [ ] **Step 4: Test as a regular manager**

1. Login as a regular (non-superadmin) manager
2. Navigate to Settings
3. Verify the "Add Manager" section does NOT appear

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address any issues found during testing"
```
