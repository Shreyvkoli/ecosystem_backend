
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { NotificationService } from '../services/notificationService.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

const createReviewSchema = z.object({
    orderId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

/**
 * POST /api/reviews
 * Submit a review for an order
 */
router.post('/', async (req: AuthRequest, res) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { orderId, rating, comment } = createReviewSchema.parse(req.body);

        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Determine role and reviewee
        let revieweeId: string | undefined;

        if (req.userId === order.creatorId) {
            // Creator reviewing Editor
            if (!order.editorId) return res.status(400).json({ error: 'No editor assigned' });
            revieweeId = order.editorId;
        } else if (req.userId === order.editorId) {
            // Editor reviewing Creator
            revieweeId = order.creatorId;
        } else {
            return res.status(403).json({ error: 'Not a participant in this order' });
        }

        // Check strictness: Only allowed if order is COMPLETED?
        // User requirement: "After Complete Job".
        // We'll allow it if status is COMPLETED or FINAL_SUBMITTED.
        // Actually, usually Creator reviews after Completion. Editor reviews after Completion.
        if (order.status !== 'COMPLETED') {
            // Optional: Allow review if 'FINAL_SUBMITTED'?
            // Let's enforce COMPLETED for now to ensure flow.
            // Or strictly strictly only COMPLETED? 
            // If Creator hasn't marked complete, Editor can't review?
            // Maybe Editor can review once they submit Final?
            // Let's stick to COMPLETED for simplicity as per prompt "After Complete Job".
            if (order.status !== 'COMPLETED') {
                return res.status(400).json({ error: 'Order must be completed to submit a review' });
            }
        }

        // Check if review already exists
        const existing = await prisma.review.findFirst({
            where: {
                orderId,
                reviewerId: req.userId
            }
        });

        if (existing) {
            return res.status(400).json({ error: 'You have already reviewed this order' });
        }

        const review = await prisma.review.create({
            data: {
                orderId,
                reviewerId: req.userId,
                revieweeId: revieweeId!,
                rating,
                comment
            }
        });

        // Notify Reviewee
        await NotificationService.getInstance().createAndSend({
            userId: revieweeId!,
            type: 'SYSTEM',
            title: 'New Review Received',
            message: `You received a ${rating}-star rating!`,
            link: `/editor/profile` // Or creator profile
        });

        return res.status(201).json(review);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        console.error('Review submit error', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/reviews/user/:userId
 * Get reviews received by a user (public)
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const reviews = await prisma.review.findMany({
            where: { revieweeId: userId },
            include: {
                reviewer: {
                    select: { id: true, name: true, role: true, editorProfile: { select: { avatarUrl: true } } }
                },
                order: {
                    select: { id: true, title: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Calculate aggregate
        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const average = count > 0 ? sum / count : 0;

        return res.json({
            reviews,
            aggregate: {
                count,
                average
            }
        });
    } catch (error) {
        console.error('Get reviews error', error);
        return res.status(500).json({ error: 'Server error' });
    }
});

/**
 * GET /api/reviews/order/:orderId
 */
router.get('/order/:orderId', async (req: AuthRequest, res) => {
    try {
        const { orderId } = req.params;
        const reviews = await prisma.review.findMany({
            where: { orderId },
            include: {
                reviewer: { select: { id: true, name: true } }
            }
        });
        return res.json(reviews);
    } catch (err) {
        return res.status(500).json({ error: 'Server error' });
    }
});

export default router;
