import express from 'express';
import { PrismaClient } from '@prisma/client';
import { MessageType } from '../utils/enums.js';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

/**
 * Validation schemas
 */
const createMessageSchema = z.object({
  orderId: z.string().uuid('Invalid order ID'),
  fileId: z.string().uuid('Invalid file ID').optional(),
  content: z.string().min(1, 'Content is required'),
  timestamp: z.number().min(0, 'Timestamp must be non-negative').optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

const updateMessageSchema = z.object({
  content: z.string().min(1, 'Content is required').optional(),
  resolved: z.boolean().optional()
});

/**
 * GET /api/messages/order/:orderId
 * Get all messages for an order
 * Optional query params: fileId (filter by file), type (filter by message type)
 */
router.get('/order/:orderId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;
    const { fileId, type } = req.query;

    // Verify order access
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        OR: [
          { creatorId: req.userId },
          { editorId: req.userId }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    // Build where clause
    const where: any = { orderId };
    if (fileId) {
      where.fileId = fileId as string;
    }
    if (type) {
      where.type = type as MessageType;
    }

    const messages = await prisma.message.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        file: {
          select: {
            id: true,
            type: true,
            fileName: true,
            version: true
          }
        },
        order: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: [
        { timestamp: 'asc' }, // Sort by timestamp first (nulls last)
        { createdAt: 'asc' }  // Then by creation time
      ]
    });

    return res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/messages/file/:fileId
 * Get all messages for a specific file
 */
router.get('/file/:fileId', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { fileId } = req.params;

    // Verify file access via order
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        order: true
      }
    });

    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Verify order access
    if (file.order.creatorId !== req.userId && file.order.editorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
      where: { fileId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        file: {
          select: {
            id: true,
            type: true,
            fileName: true,
            version: true
          }
        }
      },
      orderBy: [
        { timestamp: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return res.json(messages);
  } catch (error) {
    console.error('Get file messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/messages
 * Create a new message/comment
 * Automatically sets type to TIMESTAMP_COMMENT if timestamp is provided
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    if (!req.userId || !req.userRole) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = createMessageSchema.parse(req.body);

    // Verify order access
    const order = await prisma.order.findFirst({
      where: {
        id: data.orderId,
        OR: [
          { creatorId: req.userId },
          { editorId: req.userId }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    // Verify file belongs to order if provided
    if (data.fileId) {
      const file = await prisma.file.findFirst({
        where: {
          id: data.fileId,
          orderId: data.orderId
        }
      });

      if (!file) {
        return res.status(400).json({ error: 'File not found in order' });
      }
    }

    // Determine message type
    // If timestamp is provided, it's a timestamp comment
    const messageType = data.timestamp !== undefined && data.timestamp !== null
      ? MessageType.TIMESTAMP_COMMENT
      : MessageType.COMMENT;

    // Create message
    const message = await prisma.message.create({
      data: {
        orderId: data.orderId,
        fileId: data.fileId,
        userId: req.userId,
        type: messageType,
        content: data.content,
        timestamp: data.timestamp,
        x: data.x,
        y: data.y,
        resolved: false
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        file: {
          select: {
            id: true,
            type: true,
            fileName: true,
            version: true
          }
        },
        order: {
          select: {
            id: true,
            title: true,
            creatorId: true,
            editorId: true
          }
        }
      }
    });

    // Update order's lastActivityAt
    await prisma.order.update({
      where: { id: data.orderId },
      data: { lastActivityAt: new Date() }
    });

    return res.status(201).json(message);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Create message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/messages/:id
 * Get a specific message by ID
 */
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        file: {
          select: {
            id: true,
            type: true,
            fileName: true,
            version: true
          }
        },
        order: {
          select: {
            id: true,
            title: true,
            creatorId: true,
            editorId: true
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify access
    if (message.order.creatorId !== req.userId && message.order.editorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(message);
  } catch (error) {
    console.error('Get message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PATCH /api/messages/:id
 * Update a message (only author or order participants can update)
 */
router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const data = updateMessageSchema.parse(req.body);

    const message = await prisma.message.findUnique({
      where: { id: req.params.id },
      include: {
        order: true
      }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only message author or order participants can update
    if (
      message.userId !== req.userId &&
      message.order.creatorId !== req.userId &&
      message.order.editorId !== req.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.message.update({
      where: { id: req.params.id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        file: {
          select: {
            id: true,
            type: true,
            fileName: true,
            version: true
          }
        },
        order: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Update message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/messages/:id
 * Delete a message (only author can delete)
 */
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const message = await prisma.message.findUnique({
      where: { id: req.params.id }
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only message author can delete
    if (message.userId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.message.delete({
      where: { id: req.params.id }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

