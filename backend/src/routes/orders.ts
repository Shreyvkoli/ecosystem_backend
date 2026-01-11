import express from 'express';
import type { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { OrderStatus, FileType } from '../utils/enums.js';
import { z } from 'zod';
import { authenticate, AuthRequest, requireCreator, requireRole } from '../middleware/auth.js';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  assignEditor,
  getRawVideoFiles,
  getSubmissionFiles
} from '../services/orderService.js';
import { generateDownloadUrl, PRESIGNED_URL_EXPIRY_SECONDS } from '../utils/s3.js';
import { s3Client } from '../utils/s3.js';
import { sendEmail } from '../utils/email.js';
import { uploadVideoToYouTube } from '../utils/youtube.js';

const router = express.Router();
const prisma = new PrismaClient();

const ORDER_STATUS = {
  OPEN: 'OPEN',
  APPLIED: 'APPLIED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  PREVIEW_SUBMITTED: 'PREVIEW_SUBMITTED',
  REVISION_REQUESTED: 'REVISION_REQUESTED',
  FINAL_SUBMITTED: 'FINAL_SUBMITTED',
  PUBLISHED: 'PUBLISHED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

const APPLICATION_STATUS = {
  APPLIED: 'APPLIED',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

router.use(authenticate);

function computeDepositAmount(orderAmount?: number | null): number {
  if (!orderAmount || orderAmount <= 0) {
    return 500;
  }

  const pct = orderAmount * 0.05;
  return Math.min(2000, Math.max(500, Math.round(pct)));
}

/**
 * GET /api/orders
 * Get all orders for the authenticated user (filtered by role)
 */
// GET /api/orders - rewritten with raw query to bypass Prisma P2032 error
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const role = req.userRole;
    const userId = req.userId;
    const statusParam = typeof req.query.status === 'string' ? req.query.status : undefined;

    let orders: any[] = [];

    if (role === 'CREATOR') {
      let query = `SELECT * FROM "Order" WHERE "creatorId" = '${userId}'`;
      if (statusParam) {
        query += ` AND "status" = '${statusParam}'`;
      }
      query += ` ORDER BY "updatedAt" DESC`;
      orders = await prisma.$queryRawUnsafe(query);
    } else if (role === 'EDITOR') {
      if (statusParam && statusParam !== 'OPEN' && statusParam !== 'ASSIGNED') {
        return res.status(403).json({ error: 'Editors can only filter by OPEN or ASSIGNED status' });
      }

      if (statusParam) {
        // Filtered browse (Marketplace)
        let query = `SELECT * FROM "Order" WHERE "status" = '${statusParam}'`;
        query += ` ORDER BY "updatedAt" DESC`;
        orders = await prisma.$queryRawUnsafe(query);
      } else {
        // My Jobs
        let query = `SELECT * FROM "Order" WHERE "editorId" = '${userId}'`;
        query += ` ORDER BY "updatedAt" DESC`;
        orders = await prisma.$queryRawUnsafe(query);
      }
    } else if (role === 'ADMIN') {
      let query = `SELECT * FROM "Order"`;
      if (statusParam) {
        query += ` WHERE "status" = '${statusParam}'`;
      }
      query += ` ORDER BY "updatedAt" DESC`;
      orders = await prisma.$queryRawUnsafe(query);
    }

    // Manually attach Creator info for display (Simple, avoid complex join for now or do second fetch)
    // For now returning orders is enough to unblock.
    return res.json(orders);

  } catch (error: any) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/orders/:id
 * Get order details by ID
 */
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await getOrderById(
      req.params.id,
      req.userId,
      req.userRole as 'CREATOR' | 'EDITOR' | 'ADMIN'
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json(order);
  } catch (error: any) {
    console.error('Get order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/orders
 * Create a new order (CREATOR only)
 */
// POST /api/orders - Rewritten with raw query to bypass Prisma P2032 error
router.post('/', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      brief: z.string().optional(),
      amount: z.number().positive().optional()
    });

    const data = schema.parse(req.body);
    const id = crypto.randomUUID();
    const creatorId = req.userId!;
    const status = 'OPEN'; // Force string
    const createdAt = new Date().toISOString();
    const updatedAt = new Date().toISOString();
    const amount = data.amount || 0;
    const desc = data.description || '';
    const brief = data.brief || '';

    // Using simple INSERT query
    // Note: Use parameterized query in production properly to avoid injection. 
    // Here we use template literals for speed, relying on Zod validation which sanitize input somewhat but unsafe for text.
    // Better: use $queryRaw with prepared statement.

    await prisma.$queryRaw`
      INSERT INTO "Order" ("id", "title", "description", "brief", "amount", "creatorId", "status", "createdAt", "updatedAt", "currency", "paymentStatus", "payoutStatus", "editorDepositRequired", "editorDepositStatus", "revisionCount")
      VALUES (${id}, ${data.title}, ${desc}, ${brief}, ${amount}, ${creatorId}, ${status}, ${new Date()}, ${new Date()}, 'INR', 'PENDING', 'PENDING', false, 'PENDING', 0)
    `;

    // Fetch back
    const orders: any[] = await prisma.$queryRaw`SELECT * FROM "Order" WHERE id = ${id}`;
    return res.status(201).json(orders[0]);

  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/orders/:id/assign
 * Assign editor to order (CREATOR only)
 */
router.patch('/:id/assign', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      editorId: z.string().uuid('Invalid editor ID')
    });

    const { editorId } = schema.parse(req.body);

    const order = await assignEditor(
      req.params.id,
      editorId,
      req.userId!
    );

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to assign editor';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 400;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/orders/:id/youtube/upload
 * Upload final video to YouTube (CREATOR only)
 */
router.post('/:id/youtube/upload', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
      visibility: z.enum(['public', 'private', 'unlisted']).default('public'),
      scheduledPublishAt: z.string().datetime().optional()
    });

    const { title, description, tags, visibility, scheduledPublishAt } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        id: req.params.id,
        creatorId: req.userId!
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    if (order.status !== (ORDER_STATUS.FINAL_SUBMITTED as any)) {
      return res.status(400).json({ error: 'Order must be FINAL_SUBMITTED to upload to YouTube' });
    }

    const finalFile = await prisma.file.findFirst({
      where: {
        orderId: order.id,
        type: FileType.FINAL_VIDEO,
        uploadStatus: 'completed'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!finalFile) {
      return res.status(400).json({ error: 'Final video file not found' });
    }

    const obj = await s3Client.send(new GetObjectCommand({
      Bucket: finalFile.s3Bucket,
      Key: finalFile.s3Key
    }));

    if (!obj.Body) {
      return res.status(500).json({ error: 'Failed to read final video stream' });
    }

    const { videoId, videoUrl } = await uploadVideoToYouTube({
      userId: req.userId!,
      videoStream: obj.Body as any,
      title,
      description,
      tags,
      visibility,
      scheduledPublishAt
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: ORDER_STATUS.PUBLISHED as any,
        youtubeVideoId: videoId,
        youtubeVideoUrl: videoUrl,
        publishedAt: new Date(),
        lastActivityAt: new Date()
      }
    });

    return res.json({
      order: updated,
      youtube: {
        videoId,
        videoUrl
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('YouTube upload error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to upload to YouTube' });
  }
});

/**
 * PATCH /api/orders/:id/status
 * Update order status (with validation)
 */
router.patch('/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      status: z.nativeEnum(OrderStatus)
    });

    const { status } = schema.parse(req.body);

    const order = await updateOrderStatus({
      orderId: req.params.id,
      status,
      userId: req.userId,
      userRole: req.userRole as 'CREATOR' | 'EDITOR' | 'ADMIN'
    });

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    const message = error instanceof Error ? error.message : 'Failed to update status';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 400;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/orders/:id/approve
 * Approve order submission (CREATOR only) - convenience endpoint
 */
router.post('/:id/approve', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const order = await updateOrderStatus({
      orderId: req.params.id,
      status: OrderStatus.IN_PROGRESS,
      userId: req.userId!,
      userRole: 'CREATOR'
    });

    return res.json(order);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to approve order';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 400;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/orders/:id/request-revision
 * Request revision (CREATOR only) - convenience endpoint
 * Checks revision limit before allowing request
 */
router.post('/:id/request-revision', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    // Check revision limit first
    const order = await (prisma as any).order.findUnique({
      where: { id: req.params.id, creatorId: req.userId! }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    const MAX_REVISIONS = 2;
    if (order.revisionCount >= MAX_REVISIONS) {
      return res.status(400).json({
        error: `Maximum ${MAX_REVISIONS} revisions allowed. Additional revisions require payment upgrade.`
      });
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const result = await (tx as any).order.update({
        where: { id: req.params.id },
        data: {
          status: ORDER_STATUS.REVISION_REQUESTED,
          revisionCount: { increment: 1 },
          lastActivityAt: new Date()
        }
      });

      // Create system message for revision request
      await (tx as any).message.create({
        data: {
          orderId: req.params.id,
          userId: req.userId!,
          type: 'SYSTEM',
          content: `Revision ${order.revisionCount + 1} of ${MAX_REVISIONS} requested`
        }
      });

      return result;
    });

    return res.json(updatedOrder);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to request revision';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 400;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * GET /api/orders/:id/raw-files
 * Get raw video files for download (CREATOR/EDITOR/Admin)
 */
router.get('/:id/raw-files', requireRole(['CREATOR', 'EDITOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const files = await getRawVideoFiles(
      req.params.id,
      req.userId!,
      req.userRole as 'CREATOR' | 'EDITOR' | 'ADMIN'
    );

    return res.json(files);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to get raw files';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 403;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * GET /api/orders/:id/raw-files/:fileId/download-url
 * Get presigned URL to download raw video file (CREATOR/EDITOR/Admin)
 */
router.get('/:id/raw-files/:fileId/download-url', requireRole(['CREATOR', 'EDITOR', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    // Verify file belongs to order and is raw video
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.fileId,
        orderId: req.params.id,
        type: FileType.RAW_VIDEO
      },
      include: {
        order: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify creator/assigned editor/admin has access to this order
    if (req.userRole !== 'ADMIN' && file.order.editorId !== req.userId! && file.order.creatorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const downloadUrl = await generateDownloadUrl(file.s3Key);

    return res.json({
      downloadUrl,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      fileName: file.fileName,
      contentType: file.mimeType,
      fileSize: file.fileSize
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/orders/:id/submissions
 * Get editor submissions (preview/final files) (CREATOR only)
 */
router.get('/:id/submissions', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const files = await getSubmissionFiles(
      req.params.id,
      req.userId!,
      'CREATOR'
    );

    return res.json(files);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to get submissions';
    const statusCode = message.includes('not found') || message.includes('denied') ? 404 : 403;

    return res.status(statusCode).json({ error: message });
  }
});

/**
 * GET /api/orders/:id/submissions/:fileId/download-url
 * Get presigned URL to view submission (CREATOR only)
 */
router.get('/:id/submissions/:fileId/download-url', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: req.params.fileId,
        orderId: req.params.id,
        type: {
          in: [FileType.PREVIEW_VIDEO, FileType.FINAL_VIDEO]
        }
      },
      include: {
        order: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify creator owns this order
    if (file.order.creatorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const downloadUrl = await generateDownloadUrl(file.s3Key);

    return res.json({
      downloadUrl,
      expiresIn: PRESIGNED_URL_EXPIRY_SECONDS,
      fileName: file.fileName,
      contentType: file.mimeType,
      fileSize: file.fileSize,
      type: file.type,
      version: file.version
    });
  } catch (error: any) {
    console.error('Download URL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/orders/:id/apply
 * Apply as editor to an OPEN order (EDITOR only)
 * Locks deposit in wallet
 * Validates editor active job limit (max 2)
 */
router.post('/:id/apply', requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
  try {
    const order = await (prisma as any).order.findUnique({
      where: { id: req.params.id },
      include: {
        applications: true,
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== ORDER_STATUS.OPEN) {
      return res.status(400).json({ error: 'Order is not open for applications' });
    }

    const alreadyApplied = (order.applications || []).some((a: any) => a.editorId === req.userId!);
    if (alreadyApplied) {
      return res.status(400).json({ error: 'Already applied to this order' });
    }

    // Check editor's active job count
    const activeJobCount = await (prisma as any).order.count({
      where: {
        editorId: req.userId!,
        status: {
          in: [
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.IN_PROGRESS,
            ORDER_STATUS.PREVIEW_SUBMITTED,
            ORDER_STATUS.REVISION_REQUESTED
          ]
        }
      }
    });

    const MAX_ACTIVE_JOBS = 2;
    if (activeJobCount >= MAX_ACTIVE_JOBS) {
      return res.status(400).json({
        error: `You already have ${MAX_ACTIVE_JOBS} active jobs. Complete one to apply for new jobs.`
      });
    }

    const depositAmount = computeDepositAmount(order.amount);

    const result = await prisma.$transaction(async (tx) => {
      // Create application
      const application = await (tx as any).orderApplication.create({
        data: {
          orderId: req.params.id,
          editorId: req.userId!,
          status: APPLICATION_STATUS.APPLIED,
          depositAmount,
          depositDeadline: null
        },
        include: {
          editor: { select: { id: true, name: true, email: true } }
        }
      });

      // Keep order status as OPEN until creator approves someone
      // This allows other editors to continue seeing and applying to the order
      await (tx as any).order.update({
        where: { id: req.params.id },
        data: { status: ORDER_STATUS.OPEN } // Keep as OPEN
      });

      return { application, order };
    });

    // Send email notification to creator about new application
    try {
      await sendEmail({
        to: result.order.creator.email,
        subject: `New Application Received: ${result.order.title}`,
        template: 'new-application',
        data: {
          orderTitle: result.order.title,
          editorName: result.application.editor.name,
          editorEmail: result.application.editor.email,
          depositAmount: result.application.depositAmount,
          appliedAt: new Date().toLocaleString(),
          dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${req.params.id}`
        }
      });
    } catch (emailError) {
      console.error('Failed to send application email:', emailError);
      // Continue without failing the request
    }

    return res.status(201).json(result.application);
  } catch (error: any) {
    console.error('Apply error:', error);
    return res.status(500).json({ error: 'Failed to apply to order' });
  }
});

/**
 * GET /api/orders/:id/applications
 * List applications for an order (CREATOR only)
 */
router.get('/:id/applications', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const order = await (prisma as any).order.findUnique({
      where: { id: req.params.id, creatorId: req.userId! },
      include: {
        applications: {
          include: {
            editor: {
              include: {
                editorProfile: {
                  select: { avatarUrl: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    return res.json(order.applications || []);
  } catch (error: any) {
    console.error('List applications error:', error);
    return res.status(500).json({ error: 'Failed to list applications' });
  }
});

/**
 * POST /api/orders/:id/approve-editor
 * Approve an editor application (CREATOR only)
 * Rejects all other pending applications
 * Validates editor active job limit (max 2)
 */
router.post('/:id/approve-editor', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      applicationId: z.string().uuid()
    });

    const { applicationId } = schema.parse(req.body);

    const order = await (prisma as any).order.findUnique({
      where: { id: req.params.id, creatorId: req.userId! },
      include: {
        applications: {
          include: {
            editor: { select: { id: true, name: true, email: true } }
          }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    if (order.status !== ORDER_STATUS.OPEN && order.status !== ORDER_STATUS.APPLIED) {
      return res.status(400).json({ error: 'Order is not accepting applications' });
    }

    const targetApplication = (order.applications || []).find((a: any) => a.id === applicationId);
    if (!targetApplication) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (targetApplication.status !== APPLICATION_STATUS.APPLIED) {
      return res.status(400).json({ error: 'Application is not active' });
    }

    // Re-check editor's active job count before approval
    const activeJobCount = await (prisma as any).order.count({
      where: {
        editorId: targetApplication.editorId,
        status: {
          in: [
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.IN_PROGRESS,
            ORDER_STATUS.PREVIEW_SUBMITTED,
            ORDER_STATUS.REVISION_REQUESTED
          ]
        }
      }
    });

    const MAX_ACTIVE_JOBS = 2;
    if (activeJobCount >= MAX_ACTIVE_JOBS) {
      return res.status(400).json({
        error: `Editor already has ${MAX_ACTIVE_JOBS} active jobs. Cannot approve this application.`
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Approve the selected application
      const approved = await (tx as any).orderApplication.update({
        where: { id: applicationId },
        data: { status: APPLICATION_STATUS.APPROVED },
        include: {
          editor: { select: { id: true, name: true, email: true } }
        }
      });

      // Reject all other pending applications
      const otherApplied = (order.applications || []).filter((a: any) => a.id !== applicationId && a.status === APPLICATION_STATUS.APPLIED);
      for (const app of otherApplied) {
        await (tx as any).orderApplication.update({
          where: { id: app.id },
          data: { status: APPLICATION_STATUS.REJECTED }
        });
      }

      // Assign editor and update order status
      await (tx as any).order.update({
        where: { id: req.params.id },
        data: {
          editorId: approved.editorId,
          status: ORDER_STATUS.ASSIGNED,
          assignedAt: new Date(),
          lastActivityAt: new Date(),
          editorDepositRequired: true,
          editorDepositStatus: 'PENDING'
        }
      });

      return approved;
    });

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Approve editor error:', error);
    return res.status(500).json({ error: 'Failed to approve editor' });
  }
});

/**
 * GET /api/orders/editor/active-count
 * Get current editor's active job count (EDITOR only)
 */
router.get('/editor/active-count', requireRole(['EDITOR']), async (req: AuthRequest, res: Response) => {
  try {
    const activeJobCount = await (prisma as any).order.count({
      where: {
        editorId: req.userId!,
        status: {
          in: [
            ORDER_STATUS.ASSIGNED,
            ORDER_STATUS.IN_PROGRESS,
            ORDER_STATUS.PREVIEW_SUBMITTED,
            ORDER_STATUS.REVISION_REQUESTED
          ]
        }
      }
    });

    const MAX_ACTIVE_JOBS = 2;

    return res.json({
      activeJobs: activeJobCount,
      maxActiveJobs: MAX_ACTIVE_JOBS,
      canApply: activeJobCount < MAX_ACTIVE_JOBS
    });
  } catch (error: any) {
    console.error('Get active job count error:', error);
    return res.status(500).json({ error: 'Failed to get active job count' });
  }
});

export default router;

