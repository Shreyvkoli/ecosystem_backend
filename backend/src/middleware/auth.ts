import { Response, NextFunction } from 'express';
import { AuthRequest } from './types.js';
import { verifyToken } from '../utils/jwt.js';
export type { AuthRequest } from './types.js';

/**
 * Middleware to authenticate requests using JWT token
 * Extracts token from Authorization header and verifies it
 * Attaches userId and userRole to request object
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ error: 'No authorization header provided' });
      return;
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    // Verify and decode token
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    req.userRole = decoded.role as 'CREATOR' | 'EDITOR' | 'ADMIN';

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({ error: message });
  }
};

/**
 * Middleware factory to require specific user roles
 * Must be used after authenticate middleware
 */
export const requireRole = (allowedRoles: Array<'CREATOR' | 'EDITOR' | 'ADMIN'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.userRole
      });
      return;
    }

    next();
  };
};

/**
 * Convenience middleware for CREATOR-only routes
 */
export const requireCreator = requireRole(['CREATOR']);

/**
 * Convenience middleware for EDITOR-only routes
 */
export const requireEditor = requireRole(['EDITOR']);

/**
 * Convenience middleware for ADMIN-only routes
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware to require CREATOR or ADMIN role
 */
export const requireCreatorOrAdmin = requireRole(['CREATOR', 'ADMIN']);

/**
 * Middleware to require EDITOR or ADMIN role
 */
export const requireEditorOrAdmin = requireRole(['EDITOR', 'ADMIN']);
