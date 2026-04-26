import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface VerificationResult {
    success: boolean;
    error?: string;
    mimeType?: string;
    fileSize?: number;
}

export class StorageService {
    /**
     * Verifies if a public link is accessible and returns metadata if possible.
     * Uses a lightweight HTTP HEAD request to avoid downloading massive video files.
     */
    static async verifyPublicLink(url: string): Promise<VerificationResult> {
        try {
            const driveRegex = /drive\.google\.com/;
            const dropboxRegex = /dropbox\.com/;

            const response = await fetch(url, {
                method: 'HEAD',
                headers: { 'User-Agent': 'Ecosystem-Storage-Heartbeat/1.0' }
            });

            if (!response.ok) {
                return { success: false, error: `HTTP ${response.status}` };
            }

            const contentType = response.headers.get('content-type') || '';
            const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

            // Google Drive Logic: If it's a private file, Google redirects/returns a choice page (text/html)
            // A direct public video link should typically have a binary or video content type.
            if (driveRegex.test(url) && contentType.includes('text/html') && contentLength < 100000) {
                return { success: false, error: 'PRIVATE_OR_UNAUTHORIZED' };
            }

            return {
                success: true,
                mimeType: contentType || undefined,
                fileSize: contentLength || undefined
            };
        } catch (error: any) {
            return { success: false, error: 'CONNECTION_FAILED' };
        }
    }

    /**
     * Updates the verification status of a file record in the database.
     */
    static async updateFileVerificationStatus(fileId: string): Promise<void> {
        const file = await prisma.file.findUnique({
            where: { id: fileId }
        });

        if (!file || !file.publicLink) return;

        const result = await this.verifyPublicLink(file.publicLink);

        await (prisma.file as any).update({
            where: { id: fileId },
            data: {
                verificationStatus: result.success ? 'SUCCESS' : 'FAILED',
                lastVerifiedAt: new Date(),
                lastError: result.error || null,
                mimeType: result.mimeType || file.mimeType,
                fileSize: result.fileSize || file.fileSize
            }
        });

        // Trigger notification if verification failed for an active order
        if (!result.success) {
            console.warn(`[StorageService] LINK FAILED for file ${fileId}: ${result.error}`);
            // TODO: Emit Socket.io or Email notification to order owner
        }
    }
}
