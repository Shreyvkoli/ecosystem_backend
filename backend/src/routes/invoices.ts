
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { generateInvoice } from '../services/invoiceService.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/invoices/order/:orderId
 * Download invoice for a specific order
 */
router.get('/order/:orderId', authenticate, async (req: AuthRequest, res: Response) => {
    try {
        const { orderId } = req.params;
        const userId = req.userId!;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { creator: true, editor: true }
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Access Control
        if (order.creatorId !== userId && order.editorId !== userId && req.userRole !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Generate Invoice Data
        const invoiceData = {
            invoiceNumber: `INV-${order.id.slice(0, 8).toUpperCase()}`,
            date: new Date(), // Or completedAt
            clientName: order.creator.name,
            clientEmail: order.creator.email,
            items: [
                {
                    description: `Video Editing Services for "${order.title}"`,
                    amount: order.amount || 0
                }
            ],
            total: order.amount || 0,
            currency: order.currency || 'INR'
        };

        generateInvoice(invoiceData, res);
        return;

    } catch (error) {
        console.error('Invoice generation error:', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Failed to generate invoice' });
        }
        return;
    }
});

export default router;
