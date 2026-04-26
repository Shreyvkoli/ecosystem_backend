
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void | Response> => {
    const key = req.headers['x-idempotency-key'] as string;
    const userId = (req as any).userId;

    if (!key || !userId || req.method === 'GET') {
        return next();
    }

    try {
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        // 1. Try to record the start of this request
        try {
            await (prisma as any).idempotencyRecord.create({
                data: {
                    key,
                    userId,
                    requestPath: req.path,
                    requestHash: crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex'),
                    status: 'STARTED',
                    expiresAt
                }
            });
        } catch (err: any) {
            // If unique constraint violation, it means a previous request with this key exists
            const existing = await (prisma as any).idempotencyRecord.findUnique({
                where: { key_userId: { key, userId } }
            });

            if (existing) {
                if (existing.status === 'COMPLETED' && existing.responseBody) {
                    return res.status(existing.responseStatus).json(JSON.parse(existing.responseBody));
                }
                if (existing.status === 'STARTED') {
                    return res.status(409).json({ 
                        error: 'Conflict: Request already in progress with this idempotency key.' 
                    });
                }
                // If FAILED, we might want to allow retry, so we delete and proceed
                await (prisma as any).idempotencyRecord.delete({ where: { id: existing.id } });
                return await idempotencyMiddleware(req, res, next);
            }
            throw err;
        }

        // 2. Wrap res.json to capture the response
        const originalJson = res.json;
        res.json = function (body: any) {
            const responseStatus = res.statusCode;
            
            // Update the record as COMPLETED
            (prisma as any).idempotencyRecord.update({
                where: { key_userId: { key, userId } },
                data: {
                    status: 'COMPLETED',
                    responseStatus,
                    responseBody: JSON.stringify(body)
                }
            }).catch((err: any) => console.error('Failed to update idempotency record:', err));

            return originalJson.call(this, body);
        };

        // Capture errors to mark as FAILED
        res.on('finish', () => {
             if (res.statusCode >= 400 && res.statusCode < 500) {
                 // Client errors are usually "completed" in terms of idempotency (we cache the error)
             } else if (res.statusCode >= 500) {
                 // Server errors might want to allow retries
                 (prisma as any).idempotencyRecord.update({
                     where: { key_userId: { key, userId } },
                     data: { status: 'FAILED' }
                 }).catch(() => {});
             }
        });

        next();
    } catch (error) {
        console.error('Idempotency middleware error:', error);
        next();
    }
};
