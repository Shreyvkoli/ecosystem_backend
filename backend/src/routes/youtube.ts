import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireCreator, AuthRequest } from '../middleware/auth.js';
import { buildYouTubeAuthUrl, upsertYouTubeAccountFromCode } from '../utils/youtube.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

router.get('/status', requireCreator, async (req: AuthRequest, res) => {
  try {
    const account = await prisma.youTubeAccount.findUnique({
      where: { userId: req.userId! },
      select: { userId: true, channelId: true, updatedAt: true }
    });

    return res.json({
      connected: Boolean(account),
      channelId: account?.channelId || null,
      updatedAt: account?.updatedAt || null
    });
  } catch (error) {
    console.error('YouTube status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/auth-url', requireCreator, async (req: AuthRequest, res) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    const state = jwt.sign(
      { userId: req.userId!, role: req.userRole },
      secret,
      { expiresIn: '10m' }
    );

    const url = buildYouTubeAuthUrl(state);
    return res.json({ url });
  } catch (error) {
    console.error('YouTube auth-url error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const code = typeof req.query.code === 'string' ? req.query.code : undefined;
    const state = typeof req.query.state === 'string' ? req.query.state : undefined;

    if (!code || !state) {
      return res.status(400).send('Missing code/state');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).send('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(state, secret) as any;
    const userId = decoded?.userId as string | undefined;
    const role = decoded?.role as string | undefined;

    if (!userId || role !== 'CREATOR') {
      return res.status(403).send('Invalid state');
    }

    await upsertYouTubeAccountFromCode(userId, code);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/dashboard?youtube=connected`);
  } catch (error: any) {
    console.error('YouTube callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const msg = encodeURIComponent(error?.message || 'YouTube connection failed');
    return res.redirect(`${frontendUrl}/dashboard?youtube=error&message=${msg}`);
  }
});

export default router;
