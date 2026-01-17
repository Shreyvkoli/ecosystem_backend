
import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { driveService } from '../services/googleDriveService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Register an external file (Google Drive / Dropbox)
router.post('/register', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      orderId: z.string(),
      fileName: z.string(),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
      provider: z.enum(['GOOGLE_DRIVE', 'DROPBOX', 'YOUTUBE', 'DirectLink', 'OTHER']),
      externalFileId: z.string().optional(),
      publicLink: z.string().optional(),
      type: z.enum(['RAW_VIDEO', 'PREVIEW_VIDEO', 'FINAL_VIDEO'])
    });

    // Note: Provider enum expanded to include DirectLink/OTHER

    const data = schema.parse(req.body);

    // Verification: Need either externalFileId OR publicLink
    if (!data.externalFileId && !data.publicLink) {
      return res.status(400).json({ error: 'Must provide either externalFileId or publicLink' });
    }

    // Verify order access
    const order = await prisma.order.findUnique({
      where: { id: data.orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Access control
    const isCreator = order.creatorId === req.userId;
    const isEditor = order.editorId === req.userId;

    if (!isCreator && !isEditor) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Role restrictions
    if (isCreator && data.type !== 'RAW_VIDEO') {
      if (data.type !== 'RAW_VIDEO' && data.type !== 'DOCUMENT') {
        // loose check
      }
    }
    if (isEditor && data.type === 'RAW_VIDEO') {
      return res.status(403).json({ error: 'Editors cannot upload raw videos' });
    }

    // Calculate version for PREVIEW/FINAL
    let version = 1;
    if (data.type === 'PREVIEW_VIDEO') {
      const lastPreview = await prisma.file.findFirst({
        where: { orderId: data.orderId, type: 'PREVIEW_VIDEO' },
        orderBy: { version: 'desc' }
      });
      version = lastPreview ? lastPreview.version + 1 : 1;
    }

    // Create File Record
    const file = await prisma.file.create({
      data: {
        orderId: data.orderId,
        type: data.type,
        fileName: data.fileName,
        mimeType: data.mimeType || 'application/octet-stream',
        fileSize: data.fileSize || 0,
        provider: data.provider as any, // Cast to any because Prisma enum might be strict
        externalFileId: data.externalFileId || '',
        publicLink: data.publicLink,
        version,
        uploadStatus: 'completed'
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

    // Auto-update Order Status
    if (data.type === 'RAW_VIDEO' && order.status === 'OPEN') {
      // Stay OPEN
    } else if (data.type === 'PREVIEW_VIDEO' && order.status === 'IN_PROGRESS') {
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'PREVIEW_SUBMITTED' }
      });
    } else if (data.type === 'FINAL_VIDEO' && order.status === 'IN_PROGRESS') {
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'FINAL_SUBMITTED' }
      });
    }

    res.json(file);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Register file error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stream Proxy Endpoint
router.get('/:id/stream', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findUnique({
      where: { id: req.params.id },
      include: { order: true }
    });

    if (!file) return res.status(404).json({ error: 'File not found' });

    // Verify Access
    const userId = req.userId!;
    const canAccess = file.order.creatorId === userId || file.order.editorId === userId;
    if (!canAccess) return res.status(403).json({ error: 'Access denied' });

    // Handle Streaming based on Provider
    if (file.provider === 'GOOGLE_DRIVE') {
      const fileId = file.externalFileId || (file.publicLink?.match(/\/file\/d\/([^\/]+)/)?.[1]);

      if (!fileId) {
        if (file.publicLink) return res.redirect(file.publicLink);
        return res.status(400).json({ error: 'No File ID or Link' });
      }

      try {
        const range = req.headers.range;
        const { stream, contentLength, contentType, contentRange } = await driveService.getFileStream(fileId, range);

        res.writeHead(range ? 206 : 200, {
          'Content-Type': contentType,
          'Content-Length': contentLength,
          'Content-Range': contentRange || undefined,
          'Accept-Ranges': 'bytes'
        });

        stream.pipe(res);
      } catch (err: any) {
        console.error('Drive Stream Error:', err.message);
        if (file.publicLink) return res.redirect(file.publicLink);
        return res.status(502).json({ error: 'Failed to stream from source' });
      }

    } else if (file.provider === 'DROPBOX') {
      const directLink = file.publicLink?.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
      if (directLink) return res.redirect(directLink);
      res.status(501).json({ error: 'Dropbox streaming invalid link' });

    } else if (file.publicLink) {
      // Generic / Direct Link Proxy / YouTube (if fallback)
      try {
        // For YouTube, Axios GET won't work, so usually we should redirect or frontend handles it.
        // But if it's MP4/Direct, Axios is good.
        // If it's a website (html), this stream will pipe html, causing video player error.

        // Check Head first?
        /* 
        const head = await axios.head(file.publicLink);
        if (!head.headers['content-type']?.includes('video') && !head.headers['content-type']?.includes('octet')) {
             return res.redirect(file.publicLink);
        }
        */

        const range = req.headers.range;
        const response = await axios.get(file.publicLink, {
          responseType: 'stream',
          headers: range ? { Range: range } : {},
          validateStatus: () => true // Handle errors manually
        });

        if (response.status >= 400) {
          return res.redirect(file.publicLink);
        }

        // Forward headers
        if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
        if (response.headers['content-length']) res.setHeader('Content-Length', response.headers['content-length']);
        if (response.headers['content-range']) res.setHeader('Content-Range', response.headers['content-range']);
        if (response.headers['accept-ranges']) res.setHeader('Accept-Ranges', response.headers['accept-ranges']);

        res.status(response.status);
        response.data.pipe(res);

      } catch (err: any) {
        console.error('Generic Stream Error:', err.message);
        return res.redirect(file.publicLink);
      }
    } else {
      res.status(400).json({ error: 'Unsupported provider' });
    }

  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
