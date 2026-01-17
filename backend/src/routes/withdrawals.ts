
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * POST /api/withdrawals/request
 * Editor requests a withdrawal
 */
router.post('/request', authenticate, requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
    try {
        const schema = z.object({
            amount: z.number().positive().min(500, "Minimum withdrawal is ₹500"),
            paymentMethod: z.enum(['UPI', 'BANK_TRANSFER', 'PAYPAL']),
            paymentDetails: z.string().min(5, "Payment details required")
        });

        const { amount, paymentMethod, paymentDetails } = schema.parse(req.body);
        const userId = req.userId!;

        // Check Balance using Transaction to ensure consistency
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error("User not found");

            if (user.walletBalance < amount) {
                throw new Error("Insufficient wallet balance");
            }

            // Deduct balance and Lock it
            await tx.user.update({
                where: { id: userId },
                data: {
                    walletBalance: { decrement: amount },
                    walletLocked: { increment: amount }
                }
            });

            // Create Request
            const request = await tx.withdrawalRequest.create({
                data: {
                    userId,
                    amount,
                    paymentMethod,
                    paymentDetails,
                    status: 'PENDING'
                }
            });

            return request;
        });

        return res.json(result);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: error.errors });
        }
        if (error.message === 'Insufficient wallet balance') {
            return res.status(400).json({ error: error.message });
        }
        console.error('Withdrawal Request Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * GET /api/withdrawals/my
 * List user's withdrawals
 */
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const requests = await prisma.withdrawalRequest.findMany({
            where: { userId: req.userId! },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
});

/**
 * GET /api/withdrawals/pending
 * Admin lists pending withdrawals
 */
router.get('/pending', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const requests = await prisma.withdrawalRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { id: true, name: true, email: true } } },
            orderBy: { createdAt: 'asc' }
        });
        return res.json(requests);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch pending withdrawals' });
    }
});

/**
 * POST /api/withdrawals/:id/process
 * Admin processes a withdrawal (Mark as PROCESSED or REJECTED)
 */
router.post('/:id/process', authenticate, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
    try {
        const { status, adminNote } = z.object({
            status: z.enum(['PROCESSED', 'REJECTED']),
            adminNote: z.string().optional()
        }).parse(req.body);

        const requestId = req.params.id;

        const result = await prisma.$transaction(async (tx) => {
            const request = await tx.withdrawalRequest.findUnique({ where: { id: requestId } });
            if (!request) throw new Error("Request not found");
            if (request.status !== 'PENDING') throw new Error("Request already processed");

            if (status === 'PROCESSED') {
                // Funds already locked. Simply mark processed.
                // Reset locked amount? No, 'walletLocked' represents funds currently in limbo OR funds withdrawn?
                // Usually 'walletLocked' implies "Pending Withdrawal". Once processed, it leaves the system.
                // So: walletLocked -= amount. 

                await tx.user.update({
                    where: { id: request.userId },
                    data: {
                        walletLocked: { decrement: request.amount }
                    }
                });

                // Create WalletTransaction record of type 'WITHDRAWAL'
                await tx.walletTransaction.create({
                    data: {
                        userId: request.userId,
                        type: 'WITHDRAWAL',
                        amount: -request.amount, // Negative or Positive? Usually tracking flow. 
                        // Let's keep it negative to show outflow in history? Logic usually dictates 'Credit/Debit'. 
                        // Let's use negative for outflow.
                    }
                });

            } else {
                // REJECTED
                // Refund: walletLocked -= amount, walletBalance += amount
                await tx.user.update({
                    where: { id: request.userId },
                    data: {
                        walletLocked: { decrement: request.amount },
                        walletBalance: { increment: request.amount }
                    }
                });
            }

            const updated = await tx.withdrawalRequest.update({
                where: { id: requestId },
                data: {
                    status,
                    adminNote,
                    processedAt: new Date()
                }
            });

            return updated;
        });

        return res.json(result);

    } catch (error: any) {
        if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
        return res.status(400).json({ error: error.message || "Failed to process" });
    }
});

export default router;
