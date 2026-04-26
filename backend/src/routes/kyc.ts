
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/kyc/submit
 * Editor submits ID and Selfie links for manual review
 */
router.post('/submit', authenticate, requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            kycIdUrl: z.string().url("Valid ID Proof link required"),
            kycSelfieUrl: z.string().url("Valid Selfie link required")
        });

        const { kycIdUrl, kycSelfieUrl } = schema.parse(req.body);
        const userId = req.userId!;

        const updated = await prisma.editorProfile.update({
            where: { userId },
            data: {
                kycIdUrl,
                kycSelfieUrl,
                kycStatus: 'PENDING'
            } as any
        });

        // Notify Admins (Maybe a general notification or a specific one)
        // For MVP, we just set the status.

        return res.json({ message: 'KYC submitted successfully and is pending review', status: (updated as any).kycStatus });

    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
        console.error('KYC Submit Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/kyc/status
 * Get current user's KYC status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const profile = await prisma.editorProfile.findUnique({
            where: { userId: req.userId! },
            select: { kycStatus: true, kycIdUrl: true, kycSelfieUrl: true } as any
        });

        if (!profile) return res.status(404).json({ error: 'Editor profile not found' });

        return res.json(profile);
    } catch (error) {
        return res.status(500).json({ error: 'Failed' });
    }
});

/**
 * GET /api/kyc/pending
 * Admin lists all pending KYC requests
 */
router.get('/pending', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const pending = await prisma.editorProfile.findMany({
            where: { kycStatus: 'PENDING' } as any,
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });
        return res.json(pending);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch pending KYC' });
    }
});

/**
 * PATCH /api/kyc/:userId/approve
 * Admin approves KYC
 */
router.patch('/:userId/approve', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;

        await prisma.editorProfile.update({
            where: { userId },
            data: { kycStatus: 'VERIFIED' } as any
        });

        // Notify User
        await NotificationService.getInstance().createAndSend({
            userId,
            type: 'SYSTEM',
            title: 'KYC Verified! ✅',
            message: 'Your identity has been verified. You can now withdraw funds.',
            link: '/editor/profile'
        });

        return res.json({ message: 'KYC Approved' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to approve' });
    }
});

/**
 * PATCH /api/kyc/:userId/reject
 * Admin rejects KYC
 */
router.patch('/:userId/reject', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        await prisma.editorProfile.update({
            where: { userId },
            data: { kycStatus: 'REJECTED' } as any
        });

        // Notify User
        await NotificationService.getInstance().createAndSend({
            userId,
            type: 'SYSTEM',
            title: 'KYC Rejected ❌',
            message: `Your KYC was rejected. Reason: ${reason || 'Invalid documents'}. Please re-submit.`,
            link: '/editor/profile'
        });

        return res.json({ message: 'KYC Rejected' });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to reject' });
    }
});

export default router;
