import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Team } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isManager: boolean;
    isSuperAdmin: boolean;
    isOwner: boolean;
    teamId: string | null;
  };
}

export async function requireManager(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.headers['x-manager-email'] as string;

    if (!email) {
      res.status(401).json({ error: 'Manager email required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isManager) {
      res.status(403).json({ error: 'Manager access required' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      isManager: user.isManager,
      isSuperAdmin: user.isSuperAdmin,
      isOwner: user.isOwner,
      teamId: user.teamId,
    };

    next();
  } catch (error) {
    console.error('Error in manager auth middleware:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

export type SubmissionAccessLevel = 'full' | 'list' | 'none';

export function isSuperuserAccessActive(team: Pick<Team, 'superuserAccessExpiresAt'>): boolean {
  return !!team.superuserAccessExpiresAt && team.superuserAccessExpiresAt.getTime() > Date.now();
}

export function resolveSubmissionAccess(
  user: AuthRequest['user'],
  team: Pick<Team, 'id' | 'superuserAccessExpiresAt'>
): SubmissionAccessLevel {
  if (!user) return 'none';
  if (user.isManager && user.teamId === team.id) return 'full';
  if (user.isSuperAdmin) return isSuperuserAccessActive(team) ? 'full' : 'list';
  return 'none';
}

/**
 * Owner-only guard for the team identified by `req.params.slug`.
 * Superadmin bypasses for support reasons.
 * Must be used after `requireManager`.
 */
export async function requireOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (user.isSuperAdmin) {
      next();
      return;
    }

    const slug = req.params.slug as string;
    if (!slug) {
      res.status(400).json({ error: 'Team slug required' });
      return;
    }

    const team = await prisma.team.findUnique({ where: { slug } });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (!user.isOwner || user.teamId !== team.id) {
      res.status(403).json({ error: 'Owner access required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Error in owner auth middleware:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}
