import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../services/storageService.js';

const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

// Queue for storage verification heartbeat
export const storageQueue = new Queue('storage_heartbeats', { connection: redisConnection });

// Worker for storage heartbeat verification
export const storageWorker = new Worker('storage_heartbeats', async (job: Job) => {
    if (job.name === 'link_verification') {
        const { fileId } = job.data;
        console.log(`[StorageQueue] Verifying link for file: ${fileId}`);
        await StorageService.updateFileVerificationStatus(fileId);
    }

    if (job.name === 'run_periodic_heartbeat') {
        console.log('[StorageQueue] Running periodic heartbeat for all active projects...');

        // Find all files associated with non-completed/non-cancelled orders
        const activeFiles = await prisma.file.findMany({
            where: {
                order: {
                    NOT: {
                        status: { in: ['COMPLETED', 'CANCELLED'] }
                    }
                }
            },
            select: { id: true }
        });

        console.log(`[StorageQueue] Adding ${activeFiles.length} files to verification queue.`);

        // Add individual verification jobs for concurrency with backoff retry
        for (const file of activeFiles) {
            await storageQueue.add('link_verification', { fileId: file.id }, {
                removeOnComplete: true,
                removeOnFail: true,
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 10000 // 10s base
                }
            });
        }
    }
}, {
    connection: redisConnection,
    concurrency: 5 // Allow 5 parallel HEAD requests
});

/**
 * Initializes the repeatable job for periodic link scanning.
 */
export async function initStorageHeartbeat() {
    // Run every 6 hours
    await storageQueue.add('run_periodic_heartbeat', {}, {
        repeat: {
            pattern: '0 */6 * * *' // Standard cron: every 6 hours
        },
        removeOnComplete: true,
        removeOnFail: true
    });
    console.log('[StorageQueue] Periodic heartbeat job scheduled (Every 6 hours)');
}

storageWorker.on('completed', job => console.log(`[StorageQueue] Job ${job.id} completed`));
storageWorker.on('failed', (job, err) => console.error(`[StorageQueue] Job ${job?.id} failed:`, err));
