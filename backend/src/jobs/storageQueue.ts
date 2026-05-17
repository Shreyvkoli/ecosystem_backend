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

    // ===== WATERMARK PROCESSING JOB =====
    if (job.name === 'watermark_preview') {
        const { fileId, publicLink, orderId } = job.data;
        console.log(`[StorageQueue] Processing watermark for file: ${fileId}, Order: ${orderId.substring(0, 8)}`);

        try {
            const { processPreviewWatermark } = await import('../services/watermarkService.js');
            const result = await processPreviewWatermark(fileId, publicLink, orderId);

            if (result.success) {
                console.log(`[StorageQueue] ✅ Watermark applied for file ${fileId}`);
            } else {
                console.warn(`[StorageQueue] ⚠️ Watermark fallback for file ${fileId}: ${result.error}`);
            }
        } catch (error: any) {
            console.error(`[StorageQueue] ❌ Watermark failed for file ${fileId}:`, error.message);
            // Don't throw — watermark failure shouldn't block the order
        }
    }

    // ===== TEMP FILE CLEANUP JOB =====
    if (job.name === 'cleanup_watermark_temp') {
        console.log('[StorageQueue] Cleaning up old watermark temp files...');
        try {
            const { cleanupOldTempFiles } = await import('../services/watermarkService.js');
            cleanupOldTempFiles();
        } catch (error) {
            console.error('[StorageQueue] Cleanup error:', error);
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

    // Cleanup watermark temp files every 12 hours
    await storageQueue.add('cleanup_watermark_temp', {}, {
        repeat: {
            pattern: '0 */12 * * *' // Every 12 hours
        },
        removeOnComplete: true,
        removeOnFail: true
    });
    console.log('[StorageQueue] Watermark temp cleanup scheduled (Every 12 hours)');
}

storageWorker.on('completed', job => console.log(`[StorageQueue] Job ${job.id} completed`));
storageWorker.on('failed', (job, err) => console.error(`[StorageQueue] Job ${job?.id} failed:`, err));
