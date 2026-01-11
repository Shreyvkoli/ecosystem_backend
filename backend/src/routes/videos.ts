import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'node:path';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many upload requests. Please try again later.' }
});

const MAX_VIDEO_FILE_SIZE_BYTES = 100 * 1024 * 1024 * 1024;
const ALLOWED_VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.mkv']);
const ALLOWED_VIDEO_MIME_TYPES = new Set(['video/mp4', 'video/quicktime', 'video/x-matroska']);

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

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

const bucket = process.env.AWS_S3_BUCKET!;

// Generate presigned URL for upload
router.post('/upload-url', authenticate, uploadLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { projectId, fileName, fileSize, mimeType, type } = z.object({
      projectId: z.string(),
      fileName: z.string(),
      fileSize: z.number().positive(),
      mimeType: z.string().optional(),
      type: z.enum(['RAW', 'PREVIEW', 'FINAL'])
    }).parse(req.body);

    const validationError = validateVideoUpload(fileName, fileSize, mimeType);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Role-based type restrictions
    if (req.userRole === 'CREATOR' && type !== 'RAW') {
      return res.status(403).json({ error: 'Creators can only upload raw videos' });
    }
    if (req.userRole === 'EDITOR' && type === 'RAW') {
      return res.status(403).json({ error: 'Editors cannot upload raw videos' });
    }

    const s3Key = `projects/${projectId}/${type.toLowerCase()}/${Date.now()}-${fileName}`;
    const video = await prisma.video.create({
      data: {
        projectId,
        type: type as 'RAW' | 'PREVIEW' | 'FINAL',
        s3Key,
        s3Bucket: bucket,
        fileName,
        fileSize,
        mimeType: mimeType || 'video/mp4',
        version: type === 'PREVIEW' ? await getNextVersion(projectId) : 1
      }
    });

    // Generate presigned URL (valid for 1 hour)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      ContentType: mimeType || 'video/mp4'
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      videoId: video.id,
      uploadUrl,
      s3Key,
      expiresIn: 3600
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Upload URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark upload as complete
router.post('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { duration } = z.object({
      duration: z.number().positive().optional()
    }).parse(req.body);

    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify access
    if (video.project.creatorId !== req.userId! && video.project.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.video.update({
      where: { id: req.params.id },
      data: {
        uploadStatus: 'completed',
        duration: duration ? Math.round(duration) : null
      },
      include: {
        project: {
          include: {
            creator: { select: { id: true, name: true } },
            editor: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Auto-update project status
    if (video.type === 'RAW' && video.project.status === 'UPLOADING') {
      await prisma.project.update({
        where: { id: video.projectId },
        data: { status: 'ASSIGNED' }
      });
    } else if (video.type === 'PREVIEW' && video.project.status === 'IN_PROGRESS') {
      await prisma.project.update({
        where: { id: video.projectId },
        data: { status: 'REVIEW' }
      });
    }

    res.json(updated);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Complete upload error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get presigned URL for viewing/downloading
router.get('/:id/view-url', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const video = await prisma.video.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Verify access
    if (video.project.creatorId !== req.userId! && video.project.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: video.s3Key
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ viewUrl, expiresIn: 3600 });
  } catch (error: any) {
    console.error('View URL error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getNextVersion(projectId: string): Promise<number> {
  const lastPreview = await prisma.video.findFirst({
    where: {
      projectId,
      type: 'PREVIEW'
    },
    orderBy: { version: 'desc' }
  });

  return lastPreview ? lastPreview.version + 1 : 1;
}

export default router;

