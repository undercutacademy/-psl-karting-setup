import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

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

export default router;

