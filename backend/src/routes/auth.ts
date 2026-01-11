import express from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { UserRole } from '../utils/enums.js';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken } from '../utils/jwt.js';

const router = express.Router();
const prisma = new PrismaClient();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' }
});

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['CREATOR', 'EDITOR'], {
    errorMap: () => ({ message: 'Role must be CREATOR or EDITOR' })
  }),
  countryCode: z.string().min(2).max(2).optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

/**
 * POST /api/auth/register
 * Register a new user (CREATOR or EDITOR only)
 * ADMIN users cannot be created through registration
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const { email, password, name, role, countryCode } = registerSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role: role as any,
        ...({ countryCode: (countryCode || 'IN').toUpperCase() } as any)
      },
      select: {
        id: true,
        email: true,
        name: true,
        // role: true, // Removed to bypass P2032 error
        ...({ countryCode: true } as any),
        createdAt: true
      }
    });

    // Generate JWT token
    const token = generateToken({
      userId: String(user.id),
      role: String(user.role)
    });

    return res.status(201).json({
      user: { ...user, role: String(role) },
      token
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  try {
    // Validate input
    const { email, password } = loginSchema.parse(req.body);

    // Find user by email (case-insensitive)
    // Find user by email (case-insensitive) using raw query to bypass Prisma type checks
    const users: any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE email = ${email.toLowerCase()}`;
    const user = users[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      role: user.role
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        countryCode: (user as any).countryCode
      },
      token
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }

    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user information
 * Requires authentication
 */
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Use raw query to fetch user to bypass Prisma type checks
    const users: any[] = await prisma.$queryRaw`SELECT * FROM "User" WHERE id = ${req.userId}`;
    const rawUser = users[0];

    if (!rawUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch profiles manually
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: rawUser.id },
      select: { id: true, bio: true, avatarUrl: true }
    });

    const editorProfile = await prisma.editorProfile.findUnique({
      where: { userId: rawUser.id },
      select: { id: true, bio: true, avatarUrl: true, rate: true, skills: true }
    });

    const user = {
      id: rawUser.id,
      email: rawUser.email,
      name: rawUser.name,
      role: rawUser.role,
      countryCode: rawUser.countryCode,
      createdAt: rawUser.createdAt,
      updatedAt: rawUser.updatedAt,
      creatorProfile,
      editorProfile
    };

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json(user);
  } catch (error: any) {
    console.error('Get user error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
