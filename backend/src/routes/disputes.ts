
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/disputes/raise
 * Editor challenges a penalty
 */
router.post('/raise', authenticate, requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            orderId: z.string().uuid(),
            reason: z.string().min(20, "Please provide a detailed reason (min 20 chars)"),
            proofUrl: z.string().url().optional()
        });

        const { orderId, reason, proofUrl } = schema.parse(req.body);
        const editorId = req.userId!;

        // Verify order exists and belongs to editor
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { creator: true }
        });

        if (!order || order.editorId !== editorId) {
            return res.status(404).json({ error: 'Order not found or access denied' });
        }

        const editorProfile = await prisma.editorProfile.findUnique({ where: { userId: editorId } });
        
        // Rate limit: 3 disputes/month
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const recentDisputes = await (prisma as any).dispute.count({
            where: { editorId, createdAt: { gte: lastMonth } }
        });

        if (recentDisputes >= 3) {
            return res.status(429).json({ error: 'Monthly dispute limit reached (max 3). Please contact support for critical issues.' });
        }

        // Create Dispute
        const dispute = await (prisma as any).dispute.create({
            data: {
                orderId,
                creatorId: order.creatorId,
                editorId,
                reason,
                proofUrl,
                status: 'PENDING'
            }
        });

        // Mark order as disputed to freeze further automation
        await prisma.order.update({
            where: { id: orderId },
            data: { 
                isDisputed: true,
                disputeReason: reason,
                disputeCreatedAt: new Date()
            }
        });

        // Notify Creator
        await NotificationService.getInstance().createAndSend({
            userId: order.creatorId,
            type: 'SYSTEM',
            title: 'Dispute Raised by Editor ⚖️',
            message: `The editor has challenged a penalty on order "${order.title}". Manual review required.`,
            link: `/admin/dashboard` 
        });

        return res.json({ message: 'Dispute raised successfully. Admin will review within 12-24 hours.', dispute });

    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
        console.error('Dispute Raise Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * POST /api/disputes/activity
 * Logs editor activity for trust verification
 */
router.post('/activity', authenticate, requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
    try {
        const { orderId, type, metadata } = z.object({
            orderId: z.string().uuid(),
            type: z.string(),
            metadata: z.any().optional()
        }).parse(req.body);

        const { logEditorActivity } = await import('../services/orderService.js');
        await logEditorActivity(orderId, req.userId!, type, metadata);

        return res.json({ success: true });
    } catch (error) {
        return res.status(400).json({ error: 'Failed to log activity' });
    }
});

/**
 * GET /api/disputes/admin/list
 * Admin lists all pending disputes
 */
router.get('/admin/list', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const disputes = await (prisma as any).dispute.findMany({
            where: { status: 'PENDING' },
            include: {
                order: { select: { title: true, amount: true } }
            }
        });
        return res.json(disputes);
    } catch (error) {
        return res.status(500).json({ error: 'Failed' });
    }
});

/**
 * POST /api/disputes/:id/resolve
 * Admin resolves a dispute
 */
router.post('/:id/resolve', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { resolution, note } = z.object({
            resolution: z.enum(['FAVOR_EDITOR', 'FAVOR_CREATOR']),
            note: z.string()
        }).parse(req.body);

        const disputeId = req.params.id;

        const result = await prisma.$transaction(async (tx) => {
            const dispute = await (tx as any).dispute.findUnique({ where: { id: disputeId } });
            if (!dispute) throw new Error("Dispute not found");

            if (resolution === 'FAVOR_EDITOR') {
                // TODO: In a real system, this would reverse the Ledger transaction.
                // For MVP, we mark as resolved and Admin manually handles repayment if needed, 
                // OR we can automate the wallet transfer back.
            }

            return await (tx as any).dispute.update({
                where: { id: disputeId },
                data: {
                    status: resolution === 'FAVOR_EDITOR' ? 'RESOLVED_FAVOR_EDITOR' : 'RESOLVED_FAVOR_CREATOR',
                    resolutionNote: note,
                    adminId: req.userId!
                }
            });
        });

        return res.json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to resolve' });
    }
});

export default router;
