import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest, requireRole } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const createProjectSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  brief: z.string().optional(),
  amount: z.number().positive().optional()
});

router.use(authenticate);

router.get('/', async (req: AuthRequest, res) => {
  try {
    const where = req.userRole === 'CREATOR' 
      ? { creatorId: req.userId! }
      : { editorId: req.userId! };

    const projects = await prisma.project.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } },
        videos: { orderBy: { createdAt: 'desc' } },
        _count: { select: { comments: true } }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } },
        videos: { orderBy: { createdAt: 'desc' } },
        comments: {
          include: {
            user: { select: { id: true, name: true } },
            video: { select: { id: true, type: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireRole(['CREATOR']), async (req: AuthRequest, res) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        ...data,
        creatorId: req.userId!
      },
      include: {
        creator: { select: { id: true, name: true, email: true } }
      }
    });

    res.status(201).json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/assign', requireRole(['CREATOR']), async (req: AuthRequest, res) => {
  try {
    const { editorId } = z.object({ editorId: z.string() }).parse(req.body);

    const project = await prisma.project.findFirst({
      where: { id: req.params.id, creatorId: req.userId! }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: {
        editorId,
        status: 'ASSIGNED'
      },
      include: {
        editor: { select: { id: true, name: true, email: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Assign project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/status', async (req: AuthRequest, res) => {
  try {
    const { status } = z.object({
      status: z.enum(['UPLOADING', 'ASSIGNED', 'IN_PROGRESS', 'REVIEW', 'REVISION', 'APPROVED', 'COMPLETED', 'CANCELLED'])
    }).parse(req.body);

    const project = await prisma.project.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Role-based status transitions
    if (req.userRole === 'CREATOR' && !['REVIEW', 'APPROVED', 'CANCELLED'].includes(status)) {
      return res.status(403).json({ error: 'Invalid status transition for creator' });
    }
    if (req.userRole === 'EDITOR' && !['IN_PROGRESS', 'REVIEW', 'REVISION'].includes(status)) {
      return res.status(403).json({ error: 'Invalid status transition for editor' });
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

