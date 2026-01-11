import express from 'express';
import type { Response } from 'express';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { FileType, OrderStatus } from '../utils/enums.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import {
  generateUploadUrl,
  generateDownloadUrl,
  initiateMultipartUpload,
  generatePartUploadUrl,
  completeMultipartUpload,
  abortMultipartUpload,
  generateS3Key,
  S3_BUCKET,
  PRESIGNED_URL_EXPIRY_SECONDS
} from '../utils/s3.js';

const router = express.Router();
const prisma = new PrismaClient();

// Multipart upload threshold (100MB)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024 * 1024;
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.mkv']);
const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-matroska']);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests. Please try again later.' }
});

function validateVideoUpload(fileName: string, fileSize: number, mimeType?: string): string | null {
  if (fileSize > MAX_VIDEO_FILE_SIZE_BYTES) {
    return 'File too large. Max allowed size is 100GB.';
  }

  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    return 'Invalid file type. Only mp4, mov, mkv are allowed.';
  }

  if (mimeType && mimeType !== 'application/octet-stream' && !ALLOWED_VIDEO_MIME_TYPES.has(mimeType)) {
    return 'Invalid file type. Only mp4, mov, mkv are allowed.';
  }

  return null;
}

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
 * POST /api/files/upload-url
 * Generate presigned URL for direct upload (files < 100MB)
 */
router.post('/upload-url', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      fileName: z.string().min(1),
      fileSize: z.number().positive(),
      mimeType: z.string().optional(),
      fileType: z.nativeEnum(FileType)
    });

    const { orderId, fileName, fileSize, mimeType, fileType } = schema.parse(req.body);

    const validationError = validateVideoUpload(fileName, fileSize, mimeType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify order access
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

    // Role-based file type restrictions
    if (req.userRole === 'CREATOR' && fileType !== FileType.RAW_VIDEO) {
      return res.status(403).json({
        error: 'Creators can only upload raw videos'
      });
    }

    if (req.userRole === 'EDITOR' && fileType === FileType.RAW_VIDEO) {
      return res.status(403).json({
        error: 'Editors cannot upload raw videos'
      });
    }

    // Use multipart for large files
    if (fileSize >= MULTIPART_THRESHOLD) {
      return res.status(400).json({
        error: 'File too large for direct upload. Use multipart upload endpoint.',
        useMultipart: true
      });
    }

    const contentType = mimeType || 'application/octet-stream';
    const version = await getNextVersion(orderId, fileType);
    const s3Key = generateS3Key(orderId, fileType, fileName, version);

    // Create File record in database
    const file = await prisma.file.create({
      data: {
        orderId,
        type: fileType,
        fileName,
        fileSize,
        mimeType: contentType,
        s3Key,
        s3Bucket: S3_BUCKET,
        s3Region: process.env.AWS_REGION || 'us-east-1',
        uploadStatus: 'pending',
        version
      }
    });

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl(s3Key, contentType);

    return res.json({
      fileId: file.id,
      uploadUrl,
      s3Key,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Upload URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/files/multipart/initiate
 * Initialize multipart upload for large files
 */
router.post('/multipart/initiate', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      fileName: z.string().min(1),
      fileSize: z.number().positive(),
      mimeType: z.string().optional(),
      fileType: z.nativeEnum(FileType)
    });

    const { orderId, fileName, fileSize, mimeType, fileType } = schema.parse(req.body);

    const validationError = validateVideoUpload(fileName, fileSize, mimeType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify order access
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
      return res.status(403).json({
        error: 'Creators can only upload raw videos'
      });
    }

    if (req.userRole === 'EDITOR' && fileType === FileType.RAW_VIDEO) {
      return res.status(403).json({
        error: 'Editors cannot upload raw videos'
      });
    }

    const contentType = mimeType || 'application/octet-stream';
    const version = await getNextVersion(orderId, fileType);
    const s3Key = generateS3Key(orderId, fileType, fileName, version);

    // Initiate multipart upload
    const uploadId = await initiateMultipartUpload(s3Key, contentType);

    // Create File record with multipart metadata
    const file = await prisma.file.create({
      data: {
        orderId,
        type: fileType,
        fileName,
        fileSize,
        mimeType: contentType,
        s3Key,
        s3Bucket: S3_BUCKET,
        s3Region: process.env.AWS_REGION || 'us-east-1',
        uploadStatus: 'uploading',
        version,
        metadata: JSON.stringify({
          uploadId,
          uploadType: 'multipart'
        })
      }
    });

    return res.json({
      fileId: file.id,
      uploadId,
      s3Key
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Initiate multipart upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/files/multipart/part-url
 * Generate presigned URL for uploading a specific part
 */
router.post('/multipart/part-url', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      fileId: z.string().uuid(),
      partNumber: z.number().int().positive(),
      uploadId: z.string()
    });

    const { fileId, partNumber, uploadId } = schema.parse(req.body);

    // Verify file access
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { order: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access to this file's order
    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify uploadId matches
    const metadata = file.metadata as any;
    if (metadata?.uploadId !== uploadId) {
      return res.status(400).json({ error: 'Invalid upload ID' });
    }

    // Generate presigned URL for part upload
    const partUrl = await generatePartUploadUrl(file.s3Key, uploadId, partNumber);

    return res.json({
      partUrl,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Part URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/files/multipart/complete
 * Complete multipart upload
 */
router.post('/multipart/complete', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      fileId: z.string().uuid(),
      uploadId: z.string(),
      parts: z.array(z.object({
        etag: z.string(),
        partNumber: z.number().int().positive()
      }))
    });

    const { fileId, uploadId, parts } = schema.parse(req.body);

    // Verify file access
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { order: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify user has access
    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verify uploadId matches
    const metadata = file.metadata as any;
    if (metadata?.uploadId !== uploadId) {
      return res.status(400).json({ error: 'Invalid upload ID' });
    }

    // Complete multipart upload
    await completeMultipartUpload(
      file.s3Key,
      uploadId,
      (parts as Array<{ etag: string; partNumber: number }>).map((p) => ({
        ETag: p.etag,
        PartNumber: p.partNumber
      }))
    );

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.file.update({
        where: { id: fileId },
        data: {
          uploadStatus: 'completed',
          metadata: {
            ...metadata,
            partsCount: parts.length,
            completedAt: new Date().toISOString()
          }
        },
        include: {
          order: {
            include: {
              creator: { select: { id: true, name: true } },
              editor: { select: { id: true, name: true } }
            }
          }
        }
      });

      if (next.type === FileType.PREVIEW_VIDEO) {
        await tx.order.update({
          where: { id: next.orderId },
          data: { status: OrderStatus.PREVIEW_SUBMITTED, lastActivityAt: new Date() }
        });
      }

      if (next.type === FileType.FINAL_VIDEO) {
        await tx.order.update({
          where: { id: next.orderId },
          data: { status: OrderStatus.FINAL_SUBMITTED, lastActivityAt: new Date() }
        });
      }

      return next;
    });

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Complete multipart upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/files/multipart/abort
 * Abort multipart upload (cleanup)
 */
router.post('/multipart/abort', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      fileId: z.string().uuid(),
      uploadId: z.string()
    });

    const { fileId, uploadId } = schema.parse(req.body);

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: { order: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Abort multipart upload
    await abortMultipartUpload(file.s3Key, uploadId);

    // Update file status
    await prisma.file.update({
      where: { id: fileId },
      data: {
        uploadStatus: 'failed'
      }
    });

    return res.json({ success: true });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Abort multipart upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/files/:id/complete
 * Mark direct upload as complete
 */
router.post('/:id/complete', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { duration } = z.object({
      duration: z.number().positive().optional()
    }).parse(req.body);

    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify access
    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const next = await tx.file.update({
        where: { id: file.id },
        data: {
          uploadStatus: 'completed',
          duration: duration ? Math.round(duration) : null
        },
        include: {
          order: {
            include: {
              creator: { select: { id: true, name: true } },
              editor: { select: { id: true, name: true } }
            }
          }
        }
      });

      if (next.type === FileType.PREVIEW_VIDEO) {
        await tx.order.update({
          where: { id: next.orderId },
          data: { status: OrderStatus.PREVIEW_SUBMITTED, lastActivityAt: new Date() }
        });
      }

      if (next.type === FileType.FINAL_VIDEO) {
        await tx.order.update({
          where: { id: next.orderId },
          data: { status: OrderStatus.FINAL_SUBMITTED, lastActivityAt: new Date() }
        });
      }

      return next;
    });

    return res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Complete upload error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/files/:id/download-url
 * Get presigned URL for downloading/viewing file
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
    if (file.order.creatorId !== req.userId! && file.order.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const downloadUrl = await generateDownloadUrl(file.s3Key);

    return res.json({
      downloadUrl,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      fileName: file.fileName,
      contentType: file.mimeType
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

