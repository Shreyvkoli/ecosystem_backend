import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/users/:userId/profile
 * Get user profile with editor details (if applicable)
 */
router.get('/:userId/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        editorProfile: true,
        creatorProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return public profile information
    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      ...(user.editorProfile && {
        bio: user.editorProfile.bio,
        avatarUrl: user.editorProfile.avatarUrl,
        rate: user.editorProfile.rate,
        skills: user.editorProfile.skills,
        portfolio: user.editorProfile.portfolio,
        available: user.editorProfile.available,
      }),
      ...(user.creatorProfile && {
        bio: user.creatorProfile.bio,
        avatarUrl: user.creatorProfile.avatarUrl,
      }),
    };

    return res.json(profile);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/editors/profiles
 * Get all editor profiles (for creators to browse)
 */
router.get('/editors/profiles', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only creators and admins can browse editor profiles
    if (req.userRole !== 'CREATOR' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const editors = await prisma.user.findMany({
      where: {
        role: 'EDITOR',
      },
      include: {
        editorProfile: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const profiles = editors.map(editor => ({
      id: editor.id,
      name: editor.name,
      email: editor.email,
      ...(editor.editorProfile && {
        bio: editor.editorProfile.bio,
        avatarUrl: editor.editorProfile.avatarUrl,
        rate: editor.editorProfile.rate,
        skills: editor.editorProfile.skills,
        portfolio: editor.editorProfile.portfolio,
        available: editor.editorProfile.available,
      }),
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get editor profiles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
