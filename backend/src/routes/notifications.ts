
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', async (req: AuthRequest, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        const notifications = await prisma.notification.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: req.userId, isRead: false }
        });

        return res.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Get notifications error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', async (req: AuthRequest, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.userId },
            data: { isRead: true }
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * PATCH /api/notifications/read-all
 * Mark all as read
 */
router.patch('/read-all', async (req: AuthRequest, res) => {
    try {
        if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { userId: req.userId, isRead: false },
            data: { isRead: true }
        });

        return res.json({ success: true });
    } catch (error) {
        console.error('Mark all read error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/notifications/sync
 * Fetch all unread notifications since a specific date (Sync-on-Reconnect)
 */
router.get('/sync', authenticate, async (req: AuthRequest, res) => {
    try {
        const since = req.query.since ? new Date(req.query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

        const missed = await prisma.notification.findMany({
            where: {
                userId: req.userId,
                OR: [
                    { isRead: false },
                    { createdAt: { gt: since } }
                ]
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return res.json(missed);
    } catch (e) {
        return res.status(500).json({ error: 'Sync failed' });
    }
});

export default router;
