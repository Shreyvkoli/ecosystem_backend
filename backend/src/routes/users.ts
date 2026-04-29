import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

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
        creatorProfile: true,
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                name: true,
                creatorProfile: { select: { avatarUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return public profile information
    const isOwnerOrAdmin = req.userId === user.id || req.userRole === 'ADMIN';

    const profile = {
      id: user.id,
      name: user.name,
      email: isOwnerOrAdmin ? user.email : user.email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Mask email for others
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
      reviews: user.reviewsReceived || []
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
        editorProfile: true,
        reviewsReceived: {
          include: {
            reviewer: {
              select: {
                name: true,
                creatorProfile: { select: { avatarUrl: true } }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
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
      reviews: editor.reviewsReceived || []
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get editor profiles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/creators/profiles
router.get('/creators/profiles', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.userRole !== 'EDITOR' && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const creators = await prisma.user.findMany({
      where: { role: 'CREATOR' },
      include: {
        creatorProfile: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const profiles = creators.map(creator => ({
      id: creator.id,
      name: creator.name,
      ...(creator.creatorProfile && {
        bio: creator.creatorProfile.bio,
        avatarUrl: creator.creatorProfile.avatarUrl,
      })
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get creator profiles error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/creators/:creatorId/interest
router.post('/creators/:creatorId/interest', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.userRole !== 'EDITOR') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const editor = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    // Create a notification for the creator
    await (prisma as any).notification.create({
      data: {
        userId: req.params.creatorId,
        type: 'EDITOR_INTEREST',
        title: 'An editor is interested in working with you',
        message: `${editor?.name} has expressed interest in your future projects.`,
        link: `/dashboard?tab=browse` 
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    console.error('Express interest error:', error);
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
            editorProfile: true,
            reviewsReceived: {
              include: {
                reviewer: {
                  select: {
                    name: true,
                    creatorProfile: { select: { avatarUrl: true } }
                  }
                }
              },
              orderBy: { createdAt: 'desc' }
            }
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
      reviews: item.editor.reviewsReceived || []
    }));

    return res.json(profiles);
  } catch (error: any) {
    console.error('Get saved editors error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/creator/profile
 * Update creator profile (Avatar, Bio)
 */
router.put('/creator/profile', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.userRole !== 'CREATOR') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      avatarUrl: z.string().url().optional(),
      bio: z.string().optional()
    });

    const { avatarUrl, bio } = schema.parse(req.body);

    const profile = await prisma.creatorProfile.upsert({
      where: { userId: req.userId },
      update: {
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(bio !== undefined && { bio })
      },
      create: {
        userId: req.userId,
        avatarUrl: avatarUrl || '',
        bio: bio || ''
      }
    });

    return res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Update creator profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/availability
router.get('/:id/availability', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const editor = await prisma.user.findUnique({
      where: { id, role: 'EDITOR' },
      include: { editorProfile: true }
    });

    if (!editor) {
      return res.status(404).json({ error: 'Editor not found' });
    }

    const maxSlots = (editor?.editorProfile as any)?.maxSlots || 2;

    // Count active jobs (excluding COMPLETED, CANCELLED, OPEN, APPLIED, SELECTED)
    // Active statuses: ASSIGNED, IN_PROGRESS, PREVIEW_SUBMITTED, REVISION_REQUESTED, FINAL_SUBMITTED
    const activeJobs = await prisma.order.findMany({
      where: {
        editorId: id,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'FINAL_SUBMITTED']
        }
      },
      select: { deadline: true },
      orderBy: { deadline: 'asc' }
    });

    const activeCount = activeJobs.length;
    let availabilityStatus = 'AVAILABLE';
    let nextAvailableAt = null;

    if (activeCount >= maxSlots) {
      availabilityStatus = 'BUSY';
      // Find earliest deadline among active jobs
      // If any job has no deadline, we might assume undefined availability or fallback
      const earliestJob = activeJobs.find(job => job.deadline);
      if (earliestJob) {
        nextAvailableAt = earliestJob.deadline;
      } else {
        // Fallback: 2 days from now if no deadline set
        const d = new Date();
        d.setDate(d.getDate() + 2);
        nextAvailableAt = d;
      }
    }

    return res.json({
      status: availabilityStatus,
      activeCount,
      maxSlots,
      nextAvailableAt
    });

  } catch (error: any) {
    console.error('Get availability error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/kyc/verify-portfolio
 * Editor submits portfolio for verification review
 */
router.post('/kyc/verify-portfolio', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || req.userRole !== 'EDITOR') {
      return res.status(403).json({ error: 'Only Editors can submit for verification' });
    }

    const schema = z.object({
      portfolioLinks: z.array(z.string().url()).min(1, "At least one portfolio link is required"),
      description: z.string().min(20, "Please provide a brief description of your experience")
    });

    const { portfolioLinks, description } = schema.parse(req.body);

    // Update Editor Profile with pending flag or similar
    // For now, we'll just log it or add a internal note
    await (prisma as any).editorProfile.update({
      where: { userId: req.userId },
      data: {
        portfolio: portfolioLinks.join(','),
        bio: `${description}`
      }
    });

    // Notify Admins (Future: Add a Review Queue record)
    console.log(`[KYC] User ${req.userId} submitted for verification.`);

    return res.json({ message: 'Verification request submitted. Admin will review your portfolio.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/users/:userId/verify
 * Admin approves or rejects verification
 */
router.patch('/:userId/verify', requireAdmin, async (req: AuthRequest, res: Response) => {
  try {

    const { userId } = req.params;
    const { isVerified, reliabilityScore } = z.object({
      isVerified: z.boolean(),
      reliabilityScore: z.number().min(0).max(100).optional()
    }).parse(req.body);

    const updatedUser = await (prisma.user as any).update({
      where: { id: userId },
      data: {
        isVerified,
        reliabilityScore: reliabilityScore ?? undefined
      }
    });

    return res.json({
      message: `User verification updated to ${isVerified}`,
      user: { id: updatedUser.id, isVerified: updatedUser.isVerified }
    });
  } catch (error: any) {
    console.error('Verify user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
