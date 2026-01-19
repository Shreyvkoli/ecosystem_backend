import express from 'express';
import type { Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { OrderStatus, FileType } from '../utils/enums.js';
import { z } from 'zod';
import { authenticate, AuthRequest, requireCreator, requireRole } from '../middleware/auth.js';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  assignEditor,
  getRawVideoFiles,
  getSubmissionFiles
} from '../services/orderService.js';
import { sendEmail } from '../utils/email.js';
import { uploadVideoToYouTube } from '../utils/youtube.js';
import crypto from 'crypto';

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

function computeDepositAmount(editingLevel?: string): number {
  switch (editingLevel) {
    case 'PREMIUM':
      return 1499;
    case 'PROFESSIONAL':
      return 499;
    case 'BASIC':
    default:
      return 199;
  }
}

/**
 * GET /api/orders
 * Get all orders for the authenticated user (filtered by role)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders = await getUserOrders(
      req.userId,
      req.userRole as 'CREATOR' | 'EDITOR' | 'ADMIN'
    );

    // Apply status filter if present
    const statusParam = req.query.status as string;
    let filteredOrders = orders;

    if (statusParam) {
      filteredOrders = orders.filter((o: any) => o.status === statusParam);
    }

    if (filteredOrders.length > 0) {
      console.log('--- GET /orders DEBUG ---');
      const first = filteredOrders[0];
      console.log('Sample Order ID:', first.id);
      console.log('Sample Keys:', Object.keys(first));
      console.log('=== DETAILED FIELD CHECK ===');
      console.log('Deadline:', first.deadline);
      console.log('Raw Footage Duration:', first.rawFootageDuration);
      console.log('Expected Duration:', first.expectedDuration);
      console.log('Reference Link:', first.referenceLink);
      console.log('Editing Level:', first.editingLevel);
      console.log('=== END FIELD CHECK ===');
    }

    return res.json(filteredOrders);
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
 * DELETE /api/orders/:id
 * Delete an order (CREATOR only, if OPEN/APPLIED)
 */
router.delete('/:id', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const { deleteOrder } = await import('../services/orderService.js');
    await deleteOrder(
      req.params.id,
      req.userId!,
      req.userRole as 'CREATOR' | 'ADMIN'
    );
    return res.status(204).send();
  } catch (error: any) {
    const message = error instanceof Error ? error.message : 'Failed to delete order';
    const statusCode = message.includes('not found') ? 404 : 403;
    return res.status(statusCode).json({ error: message });
  }
});

/**
 * POST /api/orders
 * Create a new order (CREATOR only)
 */
router.post('/', requireCreator, async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1, 'Title is required'),
      description: z.string().optional(),
      brief: z.string().optional(),
      amount: z.number().positive().optional(),
      editorId: z.string().uuid().optional(), // Allow creator to optionally set editorId directly
      rawFootageDuration: z.number().min(0, "Duration must be positive").optional(),
      expectedDuration: z.number().min(0, "Duration must be positive").optional(),
      editingLevel: z.enum(['BASIC', 'PROFESSIONAL', 'PREMIUM']).optional(),
      referenceLink: z.string().url().optional().or(z.literal('')),
      deadline: z.string().datetime().optional()
    });

    console.log('--- CREATE ORDER REQUEST ---');
    console.log('Raw Payload:', JSON.stringify(req.body, null, 2));

    const data = schema.parse(req.body);
    console.log('Parsed Data:', JSON.stringify(data, null, 2));

    const order = await createOrder({
      ...data,
      creatorId: req.userId!
    });
    console.log('Created Order:', JSON.stringify(order, null, 2));

    return res.status(201).json(order);
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

    // Verify if file has S3 keys (Legacy) or is External
    if (finalFile.provider !== 'S3' && finalFile.provider !== 'AWS') { // Assuming default was S3, new is GOOGLE_DRIVE
      // If external, we can't stream easily without custom logic
      return res.status(400).json({ error: 'Automatic YouTube upload is only supported for internal storage. Please download and upload manually.' });
    }

    /* S3 Logic disabled for Zero Storage Compliance - would require fetching publicLink stream */
    return res.status(400).json({ error: 'Direct YouTube upload temporarily unavailable for external links.' });
    /*
    const obj = await s3Client.send(new GetObjectCommand({
      Bucket: finalFile.s3Bucket,
      Key: finalFile.s3Key
    }));
    if (!obj.Body) {
      return res.status(500).json({ error: 'Failed to read final video stream' });
    }
    */

    /*
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
    */
    return res.status(400).json({ error: 'Direct YouTube upload disabled.' });
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

    // Auto-send chat message to prompt Editor for Final Link
    await prisma.message.create({
      data: {
        orderId: req.params.id,
        userId: req.userId!, // From Creator
        type: 'SYSTEM', // System or User? Use SYSTEM or act as Creator. User requested "direct editor ko chat par messgae jaye". Best to be from Creator context but maybe marked as SYSTEM for style? User implies "automatic message".
        // If type SYSTEM, it renders differently. If I use type COMMENT with Creator ID, it looks like Creator sent it.
        // Let's use standard message type but from Creator. Or SYSTEM type if available. Line 381 revisions use SYSTEM.
        // I'll use SYSTEM for clear distinction.
        content: `Preview Approved! Please confirm the version and upload the Final Video (Clean Link).`
      }
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
    const order = await prisma.order.findUnique({
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
      const result = await tx.order.update({
        where: { id: req.params.id },
        data: {
          status: ORDER_STATUS.REVISION_REQUESTED as any,
          revisionCount: { increment: 1 },
          lastActivityAt: new Date()
        }
      });

      // Create system message for revision request
      await tx.message.create({
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
 * POST /api/orders/:id/dispute
 * Raise a dispute (CREATOR or EDITOR)
 */
router.post('/:id/dispute', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const schema = z.object({
      reason: z.string().min(10, 'Please provide a detailed reason (min 10 chars)')
    });

    const { reason } = schema.parse(req.body);

    const { raiseDispute } = await import('../services/orderService.js');
    const order = await raiseDispute(
      req.params.id,
      req.userId,
      req.userRole as 'CREATOR' | 'EDITOR',
      reason
    );

    return res.json(order);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Failed to raise dispute';
    return res.status(400).json({ error: message });
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

    // Security: Editors must pay deposit
    if (req.userRole === 'EDITOR' && ((file.order as any).editorDepositRequired ?? true) && (file.order as any).editorDepositStatus !== 'PAID') {
      return res.status(403).json({ error: 'Security Deposit Required to access raw files.' });
    }

    // Return public link directly
    const downloadUrl = file.publicLink || '';

    return res.json({
      downloadUrl,
      expiresIn: 0, // Direct link
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

    const downloadUrl = file.publicLink || '';

    return res.json({
      downloadUrl,
      expiresIn: 0,
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
    const orderId = req.params.id;
    const userId = req.userId!;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { creator: { select: { email: true, name: true } } }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== OrderStatus.OPEN) {
      return res.status(400).json({ error: 'Order is not open for applications' });
    }

    const existingApp = await prisma.orderApplication.findUnique({
      where: {
        orderId_editorId: {
          orderId,
          editorId: userId
        }
      }
    });

    if (existingApp) {
      return res.status(400).json({ error: 'Already applied to this order' });
    }

    // Check active jobs
    const activeJobCount = await prisma.order.count({
      where: {
        editorId: userId,
        status: { in: [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.PREVIEW_SUBMITTED, OrderStatus.REVISION_REQUESTED] }
      }
    });

    const MAX_ACTIVE_JOBS = 2;
    if (activeJobCount >= MAX_ACTIVE_JOBS) {
      return res.status(400).json({
        error: `You already have ${MAX_ACTIVE_JOBS} active jobs. Complete one to apply for new jobs.`
      });
    }

    const application = await prisma.orderApplication.create({
      data: {
        orderId,
        editorId: userId,
        status: 'APPLIED',
        depositAmount: computeDepositAmount(order.editingLevel || 'BASIC')
      },
      include: {
        editor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Send Email
    try {
      if (order.creator?.email) {
        await sendEmail({
          to: order.creator.email,
          subject: `New Application Received: ${order.title}`,
          template: 'new-application',
          data: {
            orderTitle: order.title,
            editorName: application.editor.name,
            editorEmail: application.editor.email,
            depositAmount: application.depositAmount,
            appliedAt: new Date().toLocaleString(),
            dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${orderId}`
          }
        });
      }
    } catch (emailError) {
      console.error('Failed to send application email:', emailError);
    }

    return res.status(201).json(application);
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
    const order = await prisma.order.findUnique({
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

    const order = await prisma.order.findUnique({
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
    const activeJobCount = await prisma.order.count({
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
        error: `Editor already has ${MAX_ACTIVE_JOBS} active jobs.Cannot approve this application.`
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Approve the selected application
      const approved = await tx.orderApplication.update({
        where: { id: applicationId },
        data: { status: APPLICATION_STATUS.APPROVED as any },
        include: {
          editor: { select: { id: true, name: true, email: true } }
        }
      });

      // Reject all other pending applications
      const otherApplied = (order.applications || []).filter((a: any) => a.id !== applicationId && a.status === APPLICATION_STATUS.APPLIED);
      for (const app of otherApplied) {
        await tx.orderApplication.update({
          where: { id: app.id },
          data: { status: APPLICATION_STATUS.REJECTED as any }
        });
      }

      // Assign editor and update order status
      await tx.order.update({
        where: { id: req.params.id },
        data: {
          editorId: approved.editorId,
          status: ORDER_STATUS.ASSIGNED as any,
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
    const activeJobCount = await prisma.order.count({
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


/**
 * POST /api/orders/:id/dispute
 * Report a dispute on an order
 */
router.post('/:id/dispute', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!reason) return res.status(400).json({ error: 'Dispute reason is required' });

    const order = await prisma.order.findFirst({
      where: {
        id,
        OR: [
          { creatorId: req.userId },
          { editorId: req.userId }
        ]
      }
    });

    if (!order) return res.status(404).json({ error: 'Order not found or access denied' });

    const updated = await prisma.order.update({
      where: { id },
      data: {
        isDisputed: true,
        disputeReason: reason,
        disputeCreatedAt: new Date()
      }
    });

    console.log(`[DISPUTE] Order ${id} disputed by ${req.userId}. Reason: ${reason}`);

    return res.json(updated);
  } catch (error: any) {
    console.error('Dispute error', error);
    return res.status(500).json({ error: 'Failed to report dispute' });
  }
});

export default router;
