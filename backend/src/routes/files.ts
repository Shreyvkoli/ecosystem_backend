import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FileType, OrderStatus } from '../utils/enums.js';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { escrowQueue } from '../jobs/escrowQueue.js';

const router = express.Router();
const prisma = new PrismaClient();

async function getNextVersion(orderId: string, fileType: FileType): Promise<number> {
  if (fileType !== FileType.PREVIEW_VIDEO && fileType !== FileType.FINAL_VIDEO) {
    return 1;
  }

  const agg = await prisma.file.aggregate({
    where: {
      orderId,
      type: fileType
    },
    _max: {
      version: true
    }
  });

  const currentMax = agg._max.version || 0;
  return currentMax + 1;
}

/**
 * POST /api/files/register
 * Register an external file link (Google Drive/Dropbox)
 * This is now the PRIMARY method for adding files (Zero Storage Architecture)
 */
router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      fileName: z.string().min(1),
      fileType: z.nativeEnum(FileType),
      provider: z.string(),
      publicLink: z.string().url(),
      externalFileId: z.string().optional(),
      fileSize: z.number().optional(),
      mimeType: z.string().optional(),
      duration: z.number().optional()
    });

    const {
      orderId,
      fileName,
      fileType,
      provider,
      publicLink,
      externalFileId,
      fileSize,
      mimeType,
      duration
    } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    // Role-based restrictions
    if (req.userRole === 'CREATOR' && fileType !== FileType.RAW_VIDEO) {
      return res.status(403).json({ error: 'Creators can only upload raw videos' });
    }

    if (req.userRole === 'EDITOR' && fileType !== FileType.PREVIEW_VIDEO && fileType !== FileType.FINAL_VIDEO) {
      return res.status(403).json({ error: 'Editors can only submit preview or final videos' });
    }

    const version = await getNextVersion(orderId, fileType);

    const result = await prisma.$transaction(async (tx) => {
      // Set all previous files of this type to NOT latest
      await (tx.file as any).updateMany({
        where: { orderId, type: fileType as any },
        data: { isLatest: false }
      });

      const file = await (tx.file as any).create({
        data: {
          orderId,
          type: fileType,
          fileName,
          provider,
          publicLink,
          externalFileId: externalFileId || 'external',
          version,
          isLatest: true,
          uploadStatus: 'completed',
          fileSize: fileSize || 0,
          mimeType: mimeType || 'application/octet-stream',
          duration: duration ? Math.round(duration) : null,
          metadata: JSON.stringify({
            registered: true,
            registeredAt: new Date().toISOString()
          })
        }
      });

      // Update Order Status based on file type
      if (fileType === FileType.PREVIEW_VIDEO) {
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PREVIEW_SUBMITTED,
            lastActivityAt: new Date(),
            revisionCount: 0 // Reset revision count on new preview
          }
        });

        // Notify Creator
        await tx.message.create({
          data: {
            orderId,
            userId: req.userId!,
            type: 'SYSTEM',
            content: `New Preview (v${version}) submitted: [${fileName}]`
          }
        });
      }

      if (fileType === FileType.FINAL_VIDEO) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.FINAL_SUBMITTED, lastActivityAt: new Date() }
        });

        await tx.message.create({
          data: {
            orderId,
            userId: req.userId!,
            type: 'SYSTEM',
            content: `Final Video submitted: [${fileName}]`
          }
        });

        // Trigger 72-hour Auto-Approve Timer
        try {
          await escrowQueue.add(
            'auto_approve',
            { orderId },
            { delay: 72 * 60 * 60 * 1000 }
          );
        } catch (e) { console.error('Queue error', e); }
      }

      return file;
    });

    // Trigger immediate link verification
    import('../jobs/storageQueue.js').then(({ storageQueue }) => {
      storageQueue.add('link_verification', { fileId: result.id }, {
        removeOnComplete: true,
        removeOnFail: true
      });
    }).catch(console.error);

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Register file error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/files/:id/download-url
 * Get the external link for a file
 */
router.get('/:id/download-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify access
    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId! && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Role-based raw footage protection (re-enforce from service)
    if (req.userRole === 'EDITOR' && file.type === FileType.RAW_VIDEO) {
      const isAssigned = file.order.editorId === req.userId!;
      const isDepositPaid = (file.order as any).editorDepositStatus === 'PAID';
      const isDepositRequired = (file.order as any).editorDepositRequired ?? true;
      if (!isAssigned || (isDepositRequired && !isDepositPaid)) {
        return res.status(403).json({ error: 'Access denied: Deposit required for raw footage' });
      }
    }

    // Audit Logging: Track WHO accessed WHAT and WHEN
    console.log(`[FileAudit] User ${req.userId} accessed ${file.type} (v${file.version}) for Order ${file.orderId}`);

    // For Zero Storage, simply return the public link
    const downloadUrl = file.publicLink;

    if (!downloadUrl) {
      return res.status(404).json({ error: 'File link not found' });
    }

    return res.json({
      downloadUrl,
      expiresIn: 0,
      fileName: file.fileName,
      contentType: file.mimeType || 'application/octet-stream',
      version: file.version,
      verificationStatus: (file as any).verificationStatus
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



/**
 * PATCH /api/files/:id
 * Update a file link (typically for recovery if a link breaks)
 */
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      publicLink: z.string().url(),
      fileName: z.string().optional()
    });

    const { publicLink, fileName } = schema.parse(req.body);

    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    // Permissions
    if (file.order.creatorId !== req.userId && file.order.editorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await (prisma.file as any).update({
      where: { id: file.id },
      data: {
        publicLink,
        fileName: fileName || file.fileName,
        verificationStatus: 'PENDING', // Re-verify immediately
        lastError: null
      }
    });

    // Trigger immediate re-verification
    import('../jobs/storageQueue.js').then(({ storageQueue }) => {
      storageQueue.add('link_verification', { fileId: updated.id }, {
        removeOnComplete: true,
        removeOnFail: true
      });
    }).catch(console.error);

    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/files/:id/set-latest
 * Manually set a version as the 'Latest' (Rollback logic)
 */
router.patch('/:id/set-latest', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    // Only Admin or the Creator/Editor of the order can do this
    if (file.order.creatorId !== req.userId && req.userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.$transaction([
      (prisma.file as any).updateMany({
        where: { orderId: file.orderId, type: file.type },
        data: { isLatest: false }
      }),
      (prisma.file as any).update({
        where: { id: file.id },
        data: { isLatest: true }
      })
    ]);

    return res.json({ success: true, fileId: file.id });
  } catch (e) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

