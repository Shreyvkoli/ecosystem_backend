import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole(['EDITOR']));

/**
 * GET /api/editor/profile
 * Get current editor's profile (including wallet info)
 */

router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await (prisma as any).user.findUnique({
      where: { id: req.userId! },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        walletBalance: true,
        walletLocked: true,
        editorProfile: true,
        editorApplications: {
          select: {
            id: true,
            status: true,
            depositAmount: true,
            createdAt: true,
            order: {
              select: {
                id: true,
                title: true,
                status: true,
                amount: true,
                createdAt: true
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

    return res.json(user);
  } catch (error: any) {
    console.error('Get editor profile error:', error);
    return res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * POST /api/editor/profile-photo
 * Upload profile photo
 */
router.post('/profile-photo', async (req: AuthRequest, res: Response) => {
  try {
    const { fileName, fileSize, mimeType } = req.body;

    if (!fileName || !fileSize || !mimeType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ error: 'Only image files are allowed' });
    }

    if (fileSize > 5 * 1024 * 1024) { // 5MB limit
      return res.status(400).json({ error: 'File size too large. Maximum 5MB allowed.' });
    }

    // Generate unique S3 key for profile photo
    const s3Key = `profile-photos/${req.userId!}/${Date.now()}-${fileName}`;

    // Create a simple upload URL response (you'll need to implement actual S3 upload logic)
    const uploadUrl = `https://your-s3-bucket.s3.amazonaws.com/${s3Key}`;

    return res.json({
      uploadUrl,
      s3Key,
      fileUrl: `https://your-cdn-domain.com/${s3Key}` // This would be the actual CDN URL
    });
  } catch (error: any) {
    console.error('Profile photo upload error:', error);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

/**
 * PUT /api/editor/profile
 * Update current editor's profile
 */

router.put('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      bio: z.string().optional(),
      rate: z.number().positive().optional(),
      skills: z.union([z.array(z.string()), z.string()]).optional(),
      portfolio: z.union([z.array(z.string()), z.string()]).optional(),
      available: z.boolean().optional(),
      avatarUrl: z.string().url().min(1, "Profile photo is mandatory for editors")
    });

    const data = schema.parse(req.body);

    const skills = Array.isArray(data.skills)
      ? data.skills.join(',')
      : data.skills;

    const portfolio = Array.isArray(data.portfolio)
      ? data.portfolio.join(',')
      : data.portfolio;

    const profile = await (prisma as any).editorProfile.upsert({
      where: { userId: req.userId! },
      update: {
        bio: data.bio,
        rate: data.rate,
        skills,
        portfolio,
        available: data.available,
        avatarUrl: data.avatarUrl
      },
      create: {
        userId: req.userId!,
        bio: data.bio,
        rate: data.rate,
        skills: skills ?? [],
        portfolio: portfolio ?? [],
        available: data.available ?? true,
        avatarUrl: data.avatarUrl
      }
    });

    return res.json(profile);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Update editor profile error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/editor/wallet/topup (MVP helper)
 * Add test money to wallet (development only)
 */

router.post('/wallet/topup', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      amount: z.number().positive().max(10000)
    });

    const { amount } = schema.parse(req.body);

    const result = await (prisma as any).user.update({
      where: { id: req.userId! },
      data: {
        walletBalance: { increment: amount }
      },
      select: {
        id: true,
        walletBalance: true,
        walletLocked: true
      }
    });

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Wallet topup error:', error);
    return res.status(500).json({ error: 'Failed to top up wallet' });
  }
});

export default router;
