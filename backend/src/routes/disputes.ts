
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';
import { attemptAutoResolution, executeResolution, type DisputeResolution } from '../services/disputeResolutionService.js';

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

        // ===== AUTO-RESOLUTION ATTEMPT =====
        // Run evidence analysis asynchronously (don't block the response)
        attemptAutoResolution(dispute.id).then(result => {
            console.log(`[Dispute] Auto-analysis for ${dispute.id}:`, result.resolution, result.confidence);
        }).catch(err => {
            console.error(`[Dispute] Auto-analysis failed for ${dispute.id}:`, err);
        });

        // Notify Creator
        await NotificationService.getInstance().createAndSend({
            userId: order.creatorId,
            type: 'SYSTEM',
            title: 'Dispute Raised by Editor ⚖️',
            message: `The editor has challenged a penalty on order "${order.title}". The system is analyzing evidence for auto-resolution.`,
            link: `/admin/dashboard` 
        });

        return res.json({ message: 'Dispute raised successfully. Evidence is being analyzed automatically.', dispute });

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
 * Admin lists all disputes (with auto-analysis data)
 */
router.get('/admin/list', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { status } = req.query;
        const where: any = {};
        
        if (status) {
            where.status = status as string;
        }

        const disputes = await (prisma as any).dispute.findMany({
            where,
            include: {
                order: { select: { title: true, amount: true, revisionCount: true, deadline: true, status: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse autoAnalysis JSON for each dispute
        const enriched = disputes.map((d: any) => ({
            ...d,
            autoAnalysis: d.autoAnalysis ? JSON.parse(d.autoAnalysis) : null
        }));

        return res.json(enriched);
    } catch (error) {
        return res.status(500).json({ error: 'Failed' });
    }
});

/**
 * GET /api/disputes/:id/evidence
 * Admin gets detailed evidence for a dispute
 */
router.get('/:id/evidence', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const dispute = await (prisma as any).dispute.findUnique({
            where: { id: req.params.id },
            include: {
                order: {
                    include: {
                        files: {
                            select: { id: true, type: true, version: true, fileName: true, createdAt: true }
                        },
                        messages: {
                            select: { 
                                id: true, type: true, content: true, 
                                userId: true, timestamp: true, resolved: true, createdAt: true,
                                user: { select: { name: true, role: true } }
                            },
                            orderBy: { createdAt: 'asc' }
                        }
                    }
                }
            }
        });

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        // Parse auto-analysis if present
        const autoAnalysis = dispute.autoAnalysis ? JSON.parse(dispute.autoAnalysis) : null;

        return res.json({
            dispute: {
                id: dispute.id,
                reason: dispute.reason,
                proofUrl: dispute.proofUrl,
                status: dispute.status,
                createdAt: dispute.createdAt
            },
            autoAnalysis,
            order: {
                id: dispute.order.id,
                title: dispute.order.title,
                amount: dispute.order.amount,
                revisionCount: dispute.order.revisionCount,
                deadline: dispute.order.deadline,
                status: dispute.order.status
            },
            files: dispute.order.files,
            messages: dispute.order.messages
        });
    } catch (error) {
        console.error('Evidence fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch evidence' });
    }
});

/**
 * POST /api/disputes/:id/resolve
 * Admin resolves a dispute (with expanded options)
 */
router.post('/:id/resolve', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { resolution, note } = z.object({
            resolution: z.enum(['FAVOR_EDITOR', 'FAVOR_CREATOR', 'SPLIT_50_50']),
            note: z.string()
        }).parse(req.body);

        const disputeId = req.params.id;

        // Verify dispute exists and is pending
        const dispute = await (prisma as any).dispute.findUnique({ where: { id: disputeId } });
        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }
        if (dispute.status !== 'PENDING') {
            return res.status(400).json({ error: `Dispute already resolved: ${dispute.status}` });
        }

        // Execute the resolution with full fund distribution
        const result = await executeResolution(
            disputeId,
            resolution as DisputeResolution,
            note,
            req.userId!
        );

        return res.json({ 
            message: `Dispute resolved: ${resolution}`,
            dispute: result 
        });
    } catch (error: any) {
        console.error('Dispute resolution error:', error);
        return res.status(500).json({ error: error.message || 'Failed to resolve dispute' });
    }
});

export default router;
