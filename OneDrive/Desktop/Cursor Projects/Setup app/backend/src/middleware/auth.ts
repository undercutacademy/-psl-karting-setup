import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isManager: boolean;
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
    };

    next();
  } catch (error) {
    console.error('Error in manager auth middleware:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
}

