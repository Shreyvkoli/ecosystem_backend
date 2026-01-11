import { PrismaClient } from '@prisma/client';
import { OrderStatus, FileType } from '../utils/enums.js';

const prisma = new PrismaClient();

export interface CreateOrderData {
  title: string;
  description?: string;
  brief?: string;
  amount?: number;
  creatorId: string;
}

export interface UpdateOrderStatusData {
  orderId: string;
  status: OrderStatus;
  userId: string;
  userRole: 'CREATOR' | 'EDITOR' | 'ADMIN';
}

/**
 * Order status transition rules
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, Array<{ role: 'CREATOR' | 'EDITOR' | 'ADMIN'; to: OrderStatus[] }>> = {
  OPEN: [
    { role: 'CREATOR', to: ['CANCELLED'] },
    { role: 'ADMIN', to: ['CANCELLED'] }
  ],
  APPLIED: [
    { role: 'CREATOR', to: ['ASSIGNED', 'CANCELLED'] },
    { role: 'ADMIN', to: ['ASSIGNED', 'CANCELLED'] }
  ],
  ASSIGNED: [
    { role: 'EDITOR', to: ['IN_PROGRESS'] },
    { role: 'CREATOR', to: ['CANCELLED'] },
    { role: 'ADMIN', to: ['CANCELLED'] }
  ],
  IN_PROGRESS: [
    { role: 'EDITOR', to: ['PREVIEW_SUBMITTED', 'FINAL_SUBMITTED'] },
    { role: 'CREATOR', to: ['CANCELLED'] },
    { role: 'ADMIN', to: ['CANCELLED'] }
  ],
  PREVIEW_SUBMITTED: [
    { role: 'CREATOR', to: ['REVISION_REQUESTED', 'IN_PROGRESS'] },
    { role: 'ADMIN', to: ['REVISION_REQUESTED', 'IN_PROGRESS', 'CANCELLED'] }
  ],
  REVISION_REQUESTED: [
    { role: 'EDITOR', to: ['IN_PROGRESS', 'PREVIEW_SUBMITTED'] },
    { role: 'ADMIN', to: ['IN_PROGRESS', 'PREVIEW_SUBMITTED', 'CANCELLED'] }
  ],
  FINAL_SUBMITTED: [
    { role: 'CREATOR', to: ['PUBLISHED', 'COMPLETED'] },
    { role: 'ADMIN', to: ['PUBLISHED', 'COMPLETED', 'CANCELLED'] }
  ],
  PUBLISHED: [
    { role: 'CREATOR', to: ['COMPLETED'] },
    { role: 'ADMIN', to: ['COMPLETED'] }
  ],
  COMPLETED: [
    { role: 'ADMIN', to: [] }
  ],
  CANCELLED: [
    { role: 'ADMIN', to: [] }
  ]
};

/**
 * Check if status transition is allowed for user role
 */
export function canTransitionStatus(
  from: OrderStatus,
  to: OrderStatus,
  userRole: 'CREATOR' | 'EDITOR' | 'ADMIN'
): boolean {
  if (from === to) {
    return true;
  }

  const allowed = ALLOWED_TRANSITIONS[from];
  if (!allowed) {
    return false;
  }

  if (userRole === 'ADMIN') {
    const adminTransitions = allowed.find(t => t.role === 'ADMIN');
    return adminTransitions?.to.includes(to) || false;
  }

  const roleTransitions = allowed.find(t => t.role === userRole);
  return roleTransitions?.to.includes(to) || false;
}

/**
 * Create a new order
 */
export async function createOrder(data: CreateOrderData) {
  return prisma.order.create({
    data: {
      title: data.title,
      description: data.description,
      brief: data.brief,
      amount: data.amount,
      creatorId: data.creatorId,
      status: OrderStatus.OPEN
    },
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Get orders for a user (filtered by role)
 */
export async function getUserOrders(
  userId: string,
  userRole: 'CREATOR' | 'EDITOR' | 'ADMIN'
) {
  const where = userRole === 'CREATOR'
    ? { creatorId: userId }
    : userRole === 'EDITOR'
      ? {
        OR: [
          { status: OrderStatus.OPEN }, // Show all OPEN orders to editors
          { editorId: userId },
          { applications: { some: { editorId: userId } } }
        ]
      }
      : {}; // ADMIN can see all

  return prisma.order.findMany({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      editor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      applications: userRole === 'EDITOR'
        ? {
          where: { editorId: userId },
          select: { id: true, status: true, depositAmount: true, createdAt: true, editorId: true }
        }
        : undefined,
      files: {
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          messages: true,
          files: true
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });
}

/**
 * Get order by ID with access control
 */
export async function getOrderById(
  orderId: string,
  userId: string,
  userRole: 'CREATOR' | 'EDITOR' | 'ADMIN'
) {
  const where: any = { id: orderId };

  if (userRole === 'CREATOR') {
    where.creatorId = userId;
  } else if (userRole === 'EDITOR') {
    // Editors can view:
    // - OPEN orders (available to all)
    // - orders assigned to them
    // - orders they applied to
    where.OR = [
      { status: OrderStatus.OPEN },
      { editorId: userId },
      { applications: { some: { editorId: userId } } }
    ];
  }

  return prisma.order.findFirst({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      editor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      applications: userRole === 'EDITOR'
        ? {
          where: { editorId: userId },
          select: { id: true, status: true, depositAmount: true, createdAt: true }
        }
        : userRole === 'CREATOR' || userRole === 'ADMIN'
          ? {
            orderBy: { createdAt: 'desc' },
            include: {
              editor: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  editorProfile: {
                    select: {
                      bio: true,
                      rate: true,
                      skills: true,
                      portfolio: true,
                      available: true
                    }
                  }
                }
              }
            }
          }
          : undefined,
      files: {
        orderBy: { createdAt: 'desc' }
      },
      messages: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          file: {
            select: {
              id: true,
              type: true,
              fileName: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
}

/**
 * Update order status with validation
 */
export async function updateOrderStatus(data: UpdateOrderStatusData) {
  // Get current order
  const order = await prisma.order.findUnique({
    where: { id: data.orderId }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Verify access
  if (data.userRole !== 'ADMIN') {
    if (order.creatorId !== data.userId && order.editorId !== data.userId) {
      throw new Error('Access denied');
    }
  }

  // Validate transition
  if (!canTransitionStatus(order.status as OrderStatus, data.status, data.userRole)) {
    throw new Error(
      `Invalid status transition from ${order.status} to ${data.status} for role ${data.userRole}`
    );
  }

  // Update order
  const updateData: any = {
    status: data.status
  };

  if (data.status === OrderStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }

  return prisma.order.update({
    where: { id: data.orderId },
    data: updateData,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      editor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Assign editor to order
 */
export async function assignEditor(
  orderId: string,
  editorId: string,
  creatorId: string
) {
  // Verify order belongs to creator
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      creatorId
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  if (order.status !== OrderStatus.OPEN && order.status !== OrderStatus.APPLIED) {
    throw new Error('Order must be in OPEN or APPLIED status to assign editor');
  }

  // Verify editor exists
  const editor = await prisma.user.findUnique({
    where: { id: editorId }
  });

  if (!editor || editor.role !== 'EDITOR') {
    throw new Error('Invalid editor');
  }

  return prisma.order.update({
    where: { id: orderId },
    data: {
      editorId,
      status: OrderStatus.ASSIGNED
    },
    include: {
      editor: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

/**
 * Get raw video files for an order
 */
export async function getRawVideoFiles(orderId: string, userId: string, userRole: 'CREATOR' | 'EDITOR' | 'ADMIN') {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: userRole === 'ADMIN' ? undefined : [
        { creatorId: userId },
        { editorId: userId }
      ]
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return prisma.file.findMany({
    where: {
      orderId,
      type: FileType.RAW_VIDEO,
      uploadStatus: 'completed'
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Get preview/submission files for an order
 */
export async function getSubmissionFiles(orderId: string, userId: string, userRole: 'CREATOR' | 'EDITOR' | 'ADMIN') {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      OR: userRole === 'ADMIN' ? undefined : [
        { creatorId: userId },
        { editorId: userId }
      ]
    }
  });

  if (!order) {
    throw new Error('Order not found or access denied');
  }

  return prisma.file.findMany({
    where: {
      orderId,
      type: {
        in: [FileType.PREVIEW_VIDEO, FileType.FINAL_VIDEO]
      },
      uploadStatus: 'completed'
    },
    orderBy: [
      { type: 'asc' },
      { version: 'desc' },
      { createdAt: 'desc' }
    ]
  });
}

