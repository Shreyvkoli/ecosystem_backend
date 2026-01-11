import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const createCommentSchema = z.object({
  projectId: z.string(),
  videoId: z.string().optional(),
  content: z.string().min(1),
  timestamp: z.number().min(0).optional(),
  x: z.number().optional(),
  y: z.number().optional()
});

const updateCommentSchema = z.object({
  resolved: z.boolean().optional(),
  content: z.string().min(1).optional()
});

router.use(authenticate);

router.get('/project/:projectId', async (req: AuthRequest, res) => {
  try {
    const project = await prisma.project.findFirst({
      where: {
        id: req.params.projectId,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const comments = await prisma.comment.findMany({
      where: { projectId: req.params.projectId },
      include: {
        user: { select: { id: true, name: true, role: true } },
        video: { select: { id: true, type: true, version: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const data = createCommentSchema.parse(req.body);

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: data.projectId,
        OR: [
          { creatorId: req.userId! },
          { editorId: req.userId! }
        ]
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Verify video belongs to project if provided
    if (data.videoId) {
      const video = await prisma.video.findFirst({
        where: {
          id: data.videoId,
          projectId: data.projectId
        }
      });

      if (!video) {
        return res.status(400).json({ error: 'Video not found in project' });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        ...data,
        userId: req.userId!
      },
      include: {
        user: { select: { id: true, name: true, role: true } },
        video: { select: { id: true, type: true, version: true } }
      }
    });

    // If creator comments, mark project for revision
    if (req.userRole === 'CREATOR' && project.status === 'REVIEW') {
      await prisma.project.update({
        where: { id: data.projectId },
        data: { status: 'REVISION' }
      });
    }

    res.status(201).json(comment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', async (req: AuthRequest, res) => {
  try {
    const data = updateCommentSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: { project: true }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Only comment author or project participants can update
    if (comment.userId !== req.userId! && 
        comment.project.creatorId !== req.userId! && 
        comment.project.editorId !== req.userId!) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data,
      include: {
        user: { select: { id: true, name: true, role: true } },
        video: { select: { id: true, type: true, version: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

