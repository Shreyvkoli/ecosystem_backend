import { PrismaClient } from '@prisma/client';
import { UserRole } from '../utils/enums.js';

const prisma = new PrismaClient();

export class RoleGuardService {

  /**
   * Check if user has conflicting roles (should not happen in production)
   * This is a safety check for development/testing
   */
  static async checkForRoleConflicts(userId: string): Promise<{ hasConflict: boolean; roles: UserRole[] }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return { hasConflict: false, roles: [] };
    }

    // In a proper system, user should only have ONE role
    // But we'll handle this gracefully
    const role = user.role;

    return {
      hasConflict: false, // Single role system, no conflicts
      roles: [role as UserRole]
    };
  }

  /**
   * Get user's primary role and redirect if needed
   */
  static async getValidatedRole(userId: string): Promise<{ role: UserRole; needsRedirect: boolean; redirectPath?: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return { role: 'CREATOR' as UserRole, needsRedirect: true, redirectPath: '/login' };
    }

    return {
      role: user.role as UserRole,
      needsRedirect: false
    };
  }

  /**
   * Enhanced permission checking for routes
   */
  static checkRoutePermission(userRole: UserRole, requiredRole: UserRole | UserRole[]): boolean {
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    return userRole === requiredRole;
  }

  /**
   * Get dashboard path based on user role
   */
  static getDashboardPath(role: UserRole): string {
    switch (role) {
      case 'CREATOR':
        return '/dashboard';
      case 'EDITOR':
        return '/editor/jobs';
      case 'ADMIN':
        return '/admin';
      default:
        return '/dashboard';
    }
  }

  /**
   * Validate user can access specific order features
   */
  static async canAccessOrderFeatures(userId: string, orderId: string): Promise<{
    canView: boolean;
    canEdit: boolean;
    canMessage: boolean;
    canUpload: boolean;
    reason?: string;
  }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        creator: { select: { id: true, role: true } },
        editor: { select: { id: true, role: true } }
      }
    });

    if (!order) {
      return {
        canView: false,
        canEdit: false,
        canMessage: false,
        canUpload: false,
        reason: 'Order not found'
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return {
        canView: false,
        canEdit: false,
        canMessage: false,
        canUpload: false,
        reason: 'User not found'
      };
    }

    const isCreator = order.creatorId === userId;
    const isEditor = order.editorId === userId;
    const isAdmin = user.role === 'ADMIN';

    // CREATOR permissions
    if (user.role === 'CREATOR' && isCreator) {
      return {
        canView: true,
        canEdit: true,
        canMessage: true,
        canUpload: true, // Can upload raw videos
        reason: 'Creator access'
      };
    }

    // EDITOR permissions  
    if (user.role === 'EDITOR' && isEditor) {
      const canUploadFiles = [
        'IN_PROGRESS',
        'PREVIEW_SUBMITTED',
        'REVISION_REQUESTED'
      ].includes(order.status);

      return {
        canView: true,
        canEdit: false, // Editors can't edit order details
        canMessage: true,
        canUpload: canUploadFiles,
        reason: 'Editor access'
      };
    }

    // ADMIN permissions
    if (isAdmin) {
      return {
        canView: true,
        canEdit: true,
        canMessage: true,
        canUpload: true,
        reason: 'Admin access'
      };
    }

    return {
      canView: false,
      canEdit: false,
      canMessage: false,
      canUpload: false,
      reason: 'Access denied: insufficient permissions'
    };
  }
}
