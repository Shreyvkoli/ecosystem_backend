import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { OrderStatus } from '../utils/enums.js';
import { updateOrderStatus } from '../services/orderService.js';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

// Queue for scheduling financial timeouts
export const escrowQueue = new Queue('financial_timeouts', { connection: redisConnection });

// Worker structure for async timeouts
export const escrowWorker = new Worker('financial_timeouts', async (job: Job) => {
    console.log(`Executing escrow job ${job.name} for Order ${job.data.orderId}`);

    if (job.name === 'auto_approve') {
        const { orderId } = job.data;
        const order = await prisma.order.findUnique({ where: { id: orderId } });

        // Only auto-approve if still in FINAL_SUBMITTED and NOT disputed
        if (order && order.status === OrderStatus.FINAL_SUBMITTED && !(order as any).isDisputed) {
            console.log(`Auto-approving order ${orderId}`);

            try {
                await updateOrderStatus({
                    orderId,
                    status: OrderStatus.COMPLETED,
                    userId: order.creatorId,
                    userRole: 'ADMIN' // System auto-approval
                });
                console.log(`Auto-approval payout successful for ${orderId}`);
            } catch (err) {
                console.error(`Auto-approval payout failed for ${orderId}`, err);
                throw err;
            }
        }
    } else if (job.name === 'deadline_slash_minor') {
        const { orderId } = job.data;
        const { handleGhostingPenalty } = await import('../services/orderService.js');
        await handleGhostingPenalty(orderId, 'MINOR');
    } else if (job.name === 'deadline_slash_major') {
        const { orderId } = job.data;
        const { handleGhostingPenalty } = await import('../services/orderService.js');
        await handleGhostingPenalty(orderId, 'MAJOR');
    }
}, { connection: redisConnection });

escrowWorker.on('completed', (job: Job) => console.log(`Job ${job.id} completed!`));
escrowWorker.on('failed', (job: Job | undefined, err: Error) => console.error(`Job ${job?.id} failed:`, err));
