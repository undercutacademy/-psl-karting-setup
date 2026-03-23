import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { requireManager, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Simple password hashing (for production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hashedPassword: string): boolean {
  return hashPassword(password) === hashedPassword;
}

// Manager login (email + password based, team-aware)
router.post('/manager/login', async (req, res) => {
  try {
    const { email, password, teamSlug } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { team: true },
    });

    if (!user || !user.isManager) {
      return res.status(401).json({ error: 'Unauthorized: Manager access required' });
    }

    // Verify password
    if (!user.password || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check team access: SuperAdmins can access any team, otherwise must match
    if (teamSlug) {
      const team = await prisma.team.findUnique({
        where: { slug: teamSlug },
      });

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      // If not a superadmin, must belong to the team
      if (!user.isSuperAdmin && user.teamId !== team.id) {
        return res.status(403).json({ error: 'You do not have access to this team dashboard' });
      }
    }

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
  } catch (error) {
    console.error('Error in manager login:', error);
    res.status(500).json({ error: 'Failed to authenticate' });
  }
});

// Check if email is manager
router.get('/manager/check/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email },
    });

    res.json({ isManager: user?.isManager || false });
  } catch (error) {
    console.error('Error checking manager status:', error);
    res.status(500).json({ error: 'Failed to check manager status' });
  }
});

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

export default router;

