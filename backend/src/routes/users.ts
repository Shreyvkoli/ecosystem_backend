import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
// @ts-ignore
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/users/:userId/profile
 * Get user profile with editor details (if applicable)
 */
// GET /api/users/:userId/profile
router.get('/:userId/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        editorProfile: true,
        creatorProfile: true
      }
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
        skills: user.editorProfile.skills ? user.editorProfile.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        portfolio: user.editorProfile.portfolio ? user.editorProfile.portfolio.split(',').map(s => s.trim()).filter(Boolean) : [],
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

// GET /api/users/editors/profiles
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
        role: 'EDITOR'
      },
      include: {
        editorProfile: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const profiles = editors.map(editor => ({
      id: editor.id,
      name: editor.name,
      email: editor.email,
      ...(editor.editorProfile && {
        bio: editor.editorProfile.bio,
        avatarUrl: editor.editorProfile.avatarUrl,
        rate: editor.editorProfile.rate,
        skills: editor.editorProfile.skills ? editor.editorProfile.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        portfolio: editor.editorProfile.portfolio ? editor.editorProfile.portfolio.split(',').map(s => s.trim()).filter(Boolean) : [],
        available: editor.editorProfile.available,
      }),
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get editor profiles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// POST /api/users/editors/:editorId/save
router.post('/editors/:editorId/save', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.userRole !== 'CREATOR') {
      return res.status(401).json({ error: 'Unauthorized. Only Creators can save editors.' });
    }

    const { editorId } = req.params;

    // Check if editor exists
    const editor = await prisma.user.findUnique({
      where: { id: editorId, role: 'EDITOR' }
    });

    if (!editor) {
      return res.status(404).json({ error: 'Editor not found' });
    }

    // Check if already saved
    const existing = await prisma.savedEditor.findUnique({
      where: {
        creatorId_editorId: {
          creatorId: req.userId,
          editorId
        }
      }
    });

    if (existing) {
      // Unsave
      await prisma.savedEditor.delete({
        where: { id: existing.id }
      });
      return res.json({ saved: false });
    } else {
      // Save
      await prisma.savedEditor.create({
        data: {
          creatorId: req.userId,
          editorId
        }
      });
      return res.json({ saved: true });
    }
  } catch (error: any) {
    console.error('Save editor error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/creators/saved-editors
// Get list of editors saved by the current creator
router.get('/creators/saved-editors', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.userRole !== 'CREATOR') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const savedEditors = await prisma.savedEditor.findMany({
      where: {
        creatorId: req.userId
      },
      include: {
        editor: {
          include: {
            editorProfile: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const profiles = savedEditors.map((item: any) => ({
      id: item.editor.id,
      name: item.editor.name,
      email: item.editor.email,
      savedAt: item.createdAt,
      ...(item.editor.editorProfile && {
        bio: item.editor.editorProfile.bio,
        avatarUrl: item.editor.editorProfile.avatarUrl,
        rate: item.editor.editorProfile.rate,
        skills: item.editor.editorProfile.skills ? item.editor.editorProfile.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        portfolio: item.editor.editorProfile.portfolio ? item.editor.editorProfile.portfolio.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        available: item.editor.editorProfile.available,
      }),
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get saved editors error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
