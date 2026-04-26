import { PrismaClient } from '@prisma/client';
import { OrderStatus, FileType } from '../utils/enums.js';
import { sendEmail } from '../utils/email.js';
import { NotificationService } from './notificationService.js';
import { ReputationService } from './reputationService.js';
import { escrowQueue } from '../jobs/escrowQueue.js';
import { LedgerService, AccountType } from './ledgerService.js';

const prisma = new PrismaClient();
console.log('OrderService: Prisma Client Initialized (Check for new fields support)');

export interface CreateOrderData {
  title: string;
  description?: string;
  brief?: string;
  amount?: number;
  creatorId: string;
  editorId?: string;
  rawFootageDuration?: number;
  expectedDuration?: number;
  editingLevel?: string;
  referenceLink?: string;
  deadline?: string;
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
    { role: 'CREATOR', to: ['CANCELLED', 'SELECTED'] },
    { role: 'ADMIN', to: ['CANCELLED', 'SELECTED'] }
  ],
  APPLIED: [
    { role: 'CREATOR', to: ['ASSIGNED', 'CANCELLED', 'SELECTED'] },
    { role: 'ADMIN', to: ['ASSIGNED', 'CANCELLED', 'SELECTED'] }
  ],
  SELECTED: [
    { role: 'EDITOR', to: ['ASSIGNED'] },
    { role: 'CREATOR', to: ['CANCELLED'] },
    { role: 'ADMIN', to: ['CANCELLED', 'ASSIGNED'] }
  ],
  ASSIGNED: [
    { role: 'EDITOR', to: ['IN_PROGRESS'] },
    { role: 'CREATOR', to: ['CANCELLED'] },
    { role: 'ADMIN', to: ['CANCELLED'] }
  ],
  IN_PROGRESS: [
    { role: 'EDITOR', to: ['PREVIEW_SUBMITTED', 'FINAL_SUBMITTED', 'DISPUTED'] },
    { role: 'CREATOR', to: ['CANCELLED', 'DISPUTED'] },
    { role: 'ADMIN', to: ['CANCELLED', 'DISPUTED'] }
  ],

  PREVIEW_SUBMITTED: [
    { role: 'CREATOR', to: ['REVISION_REQUESTED', 'IN_PROGRESS', 'DISPUTED'] },
    { role: 'ADMIN', to: ['REVISION_REQUESTED', 'IN_PROGRESS', 'CANCELLED', 'DISPUTED'] }
  ],
  REVISION_REQUESTED: [
    { role: 'EDITOR', to: ['IN_PROGRESS', 'PREVIEW_SUBMITTED', 'DISPUTED'] },
    { role: 'ADMIN', to: ['IN_PROGRESS', 'PREVIEW_SUBMITTED', 'CANCELLED', 'DISPUTED'] }
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
  ],
  DISPUTED: [
    { role: 'ADMIN', to: ['COMPLETED', 'CANCELLED', 'IN_PROGRESS'] }
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
      editorId: data.editorId, // Optional direct assignment
      status: data.editorId ? OrderStatus.ASSIGNED : OrderStatus.OPEN,
      assignedAt: data.editorId ? new Date() : undefined,
      rawFootageDuration: data.rawFootageDuration,
      expectedDuration: data.expectedDuration,
      editingLevel: data.editingLevel,
      referenceLink: data.referenceLink,
      deadline: data.deadline,
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
          email: true,
          creatorProfile: { select: { avatarUrl: true } }
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
          files: true,
          applications: true
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

  const order = await prisma.order.findFirst({
    where,
    include: {
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          creatorProfile: { select: { avatarUrl: true } }
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
        orderBy: [
          { type: 'asc' },
          { version: 'desc' },
          { createdAt: 'desc' }
        ]
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
              fileName: true,
              version: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      },
      _count: {
        select: {
          applications: true
        }
      }
    }
  });

  if (!order) return null;

  // Security: Filter out FINAL_VIDEO for Creator until COMPLETED
  // But also mark which one is the "Latest" version for UI clarity
  if (userRole === 'CREATOR' && order.status !== OrderStatus.COMPLETED) {
    order.files = order.files.filter(f => f.type !== FileType.FINAL_VIDEO);
  }

  // Inject a 'isLatest' flag for the UI (Versioning Logic)
  const versionMap: Record<string, number> = {};
  order.files.forEach(f => {
    if (!versionMap[f.type] || f.version > versionMap[f.type]) {
      versionMap[f.type] = f.version;
    }
  });

  (order as any).files = order.files.map(f => ({
    ...f,
    isLatest: f.version === versionMap[f.type]
  }));

  // Security: Filter out RAW_VIDEO for:
  // 1. Unassigned editors
  // 2. Assigned editors who haven't paid the deposit yet
  if (userRole === 'EDITOR') {
    const isAssigned = order.editorId === userId;
    // Cast to any because editorDepositStatus might not be in the default inferred type from findFirst, 
    // though it is in the schema.
    const isDepositPaid = (order as any).editorDepositStatus === 'PAID';
    const isDepositRequired = (order as any).editorDepositRequired ?? true;

    if (!isAssigned || (isDepositRequired && !isDepositPaid)) {
      order.files = order.files.filter(f => f.type !== FileType.RAW_VIDEO);
    }
  }

  return order;
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

  // Enforce Max Slots for Pipeline activation (SELECTED -> ASSIGNED)
  if (order.status === 'SELECTED' && data.status === 'ASSIGNED' && order.editorId) {
    const editorUser = await prisma.user.findUnique({
      where: { id: order.editorId },
      include: { editorProfile: true }
    });
    const maxSlots = (editorUser?.editorProfile as any)?.maxSlots || 2;

    const activeCount = await prisma.order.count({
      where: {
        editorId: order.editorId,
        status: {
          in: ['ASSIGNED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'FINAL_SUBMITTED']
        }
      }
    });

    if (activeCount >= maxSlots) {
      throw new Error(`Cannot start new job. You are at capacity (${activeCount}/${maxSlots}).`);
    }
  }

  // Update order
  const updateData: any = {
    status: data.status
  };

  // If Final Submission, set auto-approval timer (48h)
  if (data.status === 'FINAL_SUBMITTED') {
      updateData.autoApproveAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
      updateData.autoApproveAtSet = true;
  }

  if (data.status === OrderStatus.COMPLETED) {
    updateData.completedAt = new Date();

    // Execute completion logic in a transaction to ensure wallet consistency
    // Execute completion logic in a transaction to ensure wallet consistency
    const { updatedOrder, notifications } = await prisma.$transaction(async (tx) => {
      const notifications = [];

      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          editor: { select: { id: true, name: true, email: true } }
        }
      });

      // 1.5. Pipeline Notification Logic (Cutflow Feature)
      if (updatedOrder.editorId) {
        const editorUser = await tx.user.findUnique({
          where: { id: updatedOrder.editorId },
          include: { editorProfile: true }
        });
        const maxSlots = (editorUser?.editorProfile as any)?.maxSlots || 2;

        const activeCount = await tx.order.count({
          where: {
            editorId: updatedOrder.editorId,
            status: {
              in: ['ASSIGNED', 'IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED', 'FINAL_SUBMITTED']
            }
          }
        });

        if (activeCount < maxSlots) {
          const nextJob = await tx.order.findFirst({
            where: {
              editorId: updatedOrder.editorId,
              status: 'SELECTED'
            },
            orderBy: { createdAt: 'asc' }
          });

          if (nextJob) {
            const slotNotif = await tx.notification.create({
              data: {
                userId: updatedOrder.editorId,
                type: 'SYSTEM',
                title: 'Slot Opened!',
                message: `You can now start "${nextJob.title}" from your pipeline.`,
                link: `/editor/jobs/${nextJob.id}`
              }
            });
            notifications.push(slotNotif);
          }
        }
      }

      // 2. Release Funds to Editor (Earnings + Deposit Refund)
      // Check strict conditions: Payment must be PAID (Captured) and Editor must be assigned
      if (order.paymentStatus === 'PAID' && order.amount && order.editorId) {

        // For MVP, Platform takes 10% explicit cut via Ledger
        const platformFee = Math.round(order.amount * 0.10);
        const editorEarnings = order.amount - platformFee;

        // A. Transfer Earnings to Editor
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order.id,
          to: AccountType.EDITOR_WALLET + order.editorId,
          amount: editorEarnings,
          transactionType: 'PAYOUT',
          orderId: order.id,
          idempotencyKey: `payout_earn_${order.id}`,
          prismaTx: tx
        });

        // B. Transfer Fee to Platform
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order.id,
          to: AccountType.PLATFORM_REVENUE,
          amount: platformFee,
          transactionType: 'FEE_COLLECTION',
          orderId: order.id,
          idempotencyKey: `payout_fee_${order.id}`,
          prismaTx: tx
        });

        // C. Process Editor Deposit Refund
        const deposit = await tx.editorDeposit.findFirst({
          where: { orderId: order.id, editorId: order.editorId, status: 'PAID' }
        });

        if (deposit) {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL, // Moving deposit from gateway hold
            to: AccountType.EDITOR_WALLET + order.editorId,
            amount: deposit.amount,
            transactionType: 'DEPOSIT_REFUND',
            orderId: order.id,
            idempotencyKey: `dep_refund_${deposit.id}`,
            prismaTx: tx
          });
        }

        // D. Mark Gateway Payment as Released (Internal tracking)
        // Finds the Creator's payment for this order
        await tx.payment.updateMany({
          where: {
            orderId: order.id,
            kind: 'CREATOR_PAYMENT',
            status: 'COMPLETED', // Captured
            releasedAt: null     // Not yet released
          },
          data: {
            releasedAt: new Date(),
            releaseNote: 'Auto-released on completion'
          }
        });

        // E. Send Payment Released Notification
        const paymentNotif = await tx.notification.create({
          data: {
            userId: order.editorId,
            type: 'SYSTEM',
            title: 'Payment Released 💰',
            message: `Payment of ₹${order.amount.toLocaleString()} for "${order.title}" has been released to your wallet.`,
            link: `/editor/wallet`
          }
        });
        notifications.push(paymentNotif);

        // F. Update Reputation (On-Time Delivery Logic)
        const onTime = new Date() <= new Date(order.deadline || Date.now());
        import('./reputationService.js').then(({ ReputationService }) => {
          ReputationService.handleOrderCompletion(order.editorId!, onTime);
        }).catch(err => console.error('Reputation update failed:', err));

        // G. Update Editor Profile Metrics
        await (tx.editorProfile as any).update({
          where: { userId: order.editorId },
          data: {
            completedOrders: { increment: 1 }
          }
        });
      }

      return { updatedOrder, notifications };
    });

    // Emit real-time notifications
    const notifService = NotificationService.getInstance();
    notifications.forEach(n => notifService.notifyUser(n.userId, n));

    // Invalidate Cache
    import('./cacheService.js').then(({ CacheService }) => {
      CacheService.invalidatePattern(`user:${updatedOrder.creatorId}:*`);
      if (updatedOrder.editorId) CacheService.invalidatePattern(`user:${updatedOrder.editorId}:*`);
    }).catch(console.error);

    return updatedOrder;
  }

  if (data.status === OrderStatus.CANCELLED) {
    // Refund Logic: Return funds to Creator Wallet (if paid) and Editor Deposit (if paid)
    return prisma.$transaction(async (tx) => {
      // 1. Update Order Status
      const updatedOrder = await tx.order.update({
        where: { id: data.orderId },
        data: updateData,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          editor: { select: { id: true, name: true, email: true } }
        }
      });

      // 2. Refund Creator (if they paid)
      // Use order! to satisfy TS in strict callback scope
      if (order!.paymentStatus === 'PAID' && order!.amount) {

        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order!.id,
          to: AccountType.CREATOR_WALLET + order!.creatorId,
          amount: order!.amount,
          transactionType: 'REFUND',
          orderId: order!.id,
          idempotencyKey: `ord_cancel_refund_${order!.id}`,
          prismaTx: tx
        });

        await tx.payment.updateMany({
          where: {
            orderId: order!.id,
            kind: 'CREATOR_PAYMENT',
            status: 'COMPLETED',
            releasedAt: null
          },
          data: {
            releasedAt: new Date(),
            releaseNote: 'Refunded to Wallet on Cancellation'
          }
        });
      }

      // 3. Refund Editor Deposit (if they paid)
      if (order!.editorId) {
        const deposit = await tx.editorDeposit.findFirst({
          where: { orderId: order!.id, editorId: order!.editorId, status: 'PAID' }
        });

        if (deposit) {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.EDITOR_WALLET + order!.editorId,
            amount: deposit.amount,
            transactionType: 'DEPOSIT_REFUND',
            orderId: order!.id,
            idempotencyKey: `cancel_dep_refund_${deposit.id}`,
            prismaTx: tx
          });
        }
      }

      return updatedOrder;
    });
  }

  // Update order with Optimistic Locking
  const updatedOrder = await prisma.$transaction(async (tx) => {
    // Re-fetch within transaction to get latest version safely
    const currentOrder = await (tx.order as any).findUnique({
      where: { id: data.orderId },
      select: { version: true, status: true }
    });

    if (!currentOrder) throw new Error('Order not found');
    
    // Concurrent update check
    if (!canTransitionStatus(currentOrder.status as OrderStatus, data.status, data.userRole)) {
      throw new Error(`Invalid status transition from ${currentOrder.status} to ${data.status}`);
    }

    const { count } = await (tx.order as any).updateMany({
      where: { 
        id: data.orderId,
        version: currentOrder.version
      },
      data: {
        ...updateData,
        version: { increment: 1 }
      }
    });

    if (count === 0) {
      throw new Error('Concurrency conflict: Order was updated by another request. Please retry.');
    }

    return await tx.order.findUnique({
      where: { id: data.orderId },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } }
      }
    });
  });

  return updatedOrder as any;
}

/**
 * Handle dynamic penalties for late delivery or ghosting
 */
export async function handleGhostingPenalty(orderId: string, severity: 'MINOR' | 'MAJOR') {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { editor: true }
    });

    if (!order || !order.editorId) return;

    // Skip if already submitted or completed (Race condition check inside transaction)
    const validStatuses = ['ASSIGNED', 'IN_PROGRESS', 'REVISION_REQUESTED'];
    if (!validStatuses.includes(order.status as string)) {
        console.log(`[Penalty] Order ${orderId} is already in state: ${order.status}. Aborting slash.`);
        return;
    }

    // Find Editor Profile for Reputation & Strike Logic
    const editorProfile = await tx.editorProfile.findUnique({ where: { userId: order.editorId! } });
    
    // 1. Activity Check (Avoid False Slash)
    const recentActivity = await (tx as any).editorActivity.findFirst({
      where: { 
        orderId, 
        createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last 1 hour
      }
    });

    if (recentActivity && severity === 'MINOR') {
        console.log(`[Penalty] Active progress detected for ${orderId}. Extending grace period.`);
        // Reschedule Minor Penalty by another 2 hours
        await escrowQueue.add('deadline_slash_minor', { orderId }, { delay: 2 * 60 * 60 * 1000 });
        return;
    }

    // 2. Find Editor Deposit
    const deposit = await tx.editorDeposit.findFirst({
      where: { orderId, editorId: order.editorId, status: 'PAID' }
    });

    if (!deposit) return;

    // 3. Graduated Penalty Percent
    let penaltyPercent = severity === 'MINOR' ? 0.20 : 0.80;
    
    // First offence discount (50% off penalty amount)
    if (editorProfile && (editorProfile as any).strikeCount === 0) {
        penaltyPercent = penaltyPercent * 0.5;
        console.log(`[Penalty] Applying First-Time Grace (50% discount) for ${order.editorId}`);
    }

    let penaltyAmount = Math.round(deposit.amount * penaltyPercent);

    // 4. Compensation Cap (Total Creator payout <= 120% of Order Value)
    const maxCompensation = (order.amount || 0) * 0.20; // Max bonus is 20%
    if (penaltyAmount > maxCompensation) {
        penaltyAmount = Math.round(maxCompensation);
    }

    if (penaltyAmount > 0) {
      const { LedgerService, AccountType } = await import('./ledgerService.js');

      // Transfer Penalty (using transaction to prevent race conditions)
      await LedgerService.transfer({
        from: AccountType.GATEWAY_EXTERNAL,
        to: AccountType.CREATOR_WALLET + order.creatorId,
        amount: penaltyAmount,
        transactionType: 'GHOSTING_PENALTY',
        orderId,
        idempotencyKey: `penalty_${severity}_${orderId}_v${Date.now()}`,
        prismaTx: tx
      });

      // Update Editor Profile Metrics
      await (tx as any).editorProfile.update({
          where: { userId: order.editorId! },
          data: {
              strikeCount: { increment: 1 },
              totalPenaltyPaid: { increment: penaltyAmount }
          }
      });

      // Notify both parties
      await tx.notification.create({
        data: {
          userId: order.creatorId,
          type: 'SYSTEM',
          title: `Compensation Received! 💰`,
          message: `The editor is late. You have been credited ₹${penaltyAmount} as compensation.`,
          link: `/orders/${orderId}`
        }
      });

      await tx.notification.create({
        data: {
          userId: order.editorId,
          type: 'SYSTEM',
          title: `Penalty Applied ⚠️`,
          message: `You missed the deadline for "${order.title}". ₹${penaltyAmount} has been deducted. Repeat offences will lead to higher penalties.`,
          link: `/editor/jobs/${orderId}`
        }
      });
    }

    if (severity === 'MAJOR') {
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'CANCELLED' }
      });

      // Refund the rest of the deposit to Editor
      const remainingDeposit = deposit.amount - penaltyAmount;
      if (remainingDeposit > 0) {
        const { LedgerService, AccountType } = await import('./ledgerService.js');
        await LedgerService.transfer({
          from: AccountType.GATEWAY_EXTERNAL,
          to: AccountType.EDITOR_WALLET + order.editorId,
          amount: remainingDeposit,
          transactionType: 'DEPOSIT_REFUND',
          orderId,
          idempotencyKey: `cancel_remaining_ref_${orderId}`,
          prismaTx: tx
        });
      }

      // Refund Creator's order amount
      if (order.paymentStatus === 'PAID' && order.amount) {
        const { LedgerService, AccountType } = await import('./ledgerService.js');
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order.id,
          to: AccountType.CREATOR_WALLET + order.creatorId,
          amount: order.amount,
          transactionType: 'REFUND',
          orderId,
          idempotencyKey: `ghost_cancel_refund_${order.id}`,
          prismaTx: tx
        });
      }

      await ReputationService.updateScore(order.editorId!, -30, 'GHOSTING_MAJOR');

    } else {
        await ReputationService.updateScore(order.editorId!, -5, 'DELAY_MINOR');
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

  // Perform assignment and notifications in a transaction
  const txResult = await prisma.$transaction(async (tx) => {
    // Atomic Row Lock to prevent Race Conditions
    const lockedOrders = await tx.$queryRawUnsafe<any[]>(
      `SELECT id FROM "Order" WHERE id = $1 AND status IN ('OPEN', 'APPLIED') FOR UPDATE`,
      orderId
    );

    if (!lockedOrders || lockedOrders.length === 0) {
      throw new Error('Race condition prevented: Order is no longer available for assignment.');
    }

    const updated = await tx.order.update({
      where: { id: orderId },
      data: {
        editorId,
        status: OrderStatus.ASSIGNED,
        assignedAt: new Date(),
        // Set Milestone Deadline (30% of total duration as default)
        milestoneDeadline: (order as any).deadline ? new Date(Date.now() + (new Date((order as any).deadline).getTime() - Date.now()) * 0.3) : undefined
      } as any,
      include: {
        creator: {
          select: { name: true, email: true }
        },
        editor: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Create System Message
    await tx.message.create({
      data: {
        orderId,
        userId: creatorId,
        type: 'SYSTEM',
        content: `🎉 You have been hired! The project is assigned to @${(updated as any).editor!.name}.`
      }
    });

    // Schedule Dynamic Penalties
    if (updated.deadline) {
      const deadlineTime = new Date(updated.deadline).getTime();
      
      // 1. Minor Penalty (Deadline + 2h)
      const minorDelay = deadlineTime - Date.now() + (2 * 60 * 60 * 1000);
      if (minorDelay > 0) {
        await escrowQueue.add('deadline_slash_minor', { orderId }, { delay: minorDelay });
      }

      // 2. Major Penalty (Deadline + 12h)
      const majorDelay = deadlineTime - Date.now() + (12 * 60 * 60 * 1000);
      if (majorDelay > 0) {
        await escrowQueue.add('deadline_slash_major', { orderId }, { delay: majorDelay });
      }
    }

    // Generate Digital Contract
    const { ContractService } = await import('./contractService.js');
    await ContractService.generateForOrder(orderId);

    // Create Notification for Editor
    const notif = await tx.notification.create({
      data: {
        userId: editorId,
        title: 'New Project Assigned',
        message: `You have been assigned to order "${updated.title}". Please start working.`,
        type: 'SYSTEM',
        link: `/orders/${updated.id}`
      }
    });

    return { updatedOrder: updated as any, notification: notif };
  });

  const { updatedOrder, notification } = txResult;

  // Emit Socket Notification to Editor
  NotificationService.getInstance().notifyUser(editorId, notification);

  // Send Email Notification (Non-blocking)
  if (updatedOrder.editor?.email) {
    // Generate dashboard Link (using env or default)
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/orders/${updatedOrder.id}`;

    sendEmail({
      to: updatedOrder.editor.email,
      subject: `You're Hired! New Project: ${updatedOrder.title}`,
      template: 'job-assigned',
      data: {
        orderTitle: updatedOrder.title,
        creatorName: (updatedOrder as any).creator.name,
        amount: updatedOrder.amount,
        deadline: updatedOrder.deadline ? new Date(updatedOrder.deadline).toLocaleDateString() : 'N/A',
        dashboardUrl
      }
    } as any).catch(console.error); // Log error but don't fail request
  }

  return updatedOrder;
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

  if (userRole === 'EDITOR') {
    const isDepositPaid = (order as any).editorDepositStatus === 'PAID';
    const isDepositRequired = (order as any).editorDepositRequired ?? true;
    if (isDepositRequired && !isDepositPaid) {
      return [];
    }
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

/**
 * Raise a dispute
 */
export async function raiseDispute(
  orderId: string,
  userId: string,
  userRole: 'CREATOR' | 'EDITOR',
  reason: string
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) throw new Error('Order not found');

  if (userRole === 'CREATOR' && order.creatorId !== userId) throw new Error('Access denied');
  if (userRole === 'EDITOR' && order.editorId !== userId) throw new Error('Access denied');

  // Validate status
  const allowedStatuses = ['IN_PROGRESS', 'PREVIEW_SUBMITTED', 'REVISION_REQUESTED'];
  if (!allowedStatuses.includes(order.status)) {
    throw new Error('Disputes can only be raised during active work or review');
  }

  // Update logic
  return prisma.$transaction(async (tx) => {
    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: 'DISPUTED',
        isDisputed: true,
        disputeReason: reason,
        disputeCreatedAt: new Date(),
        lastActivityAt: new Date()
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        editor: { select: { id: true, name: true, email: true } }
      }
    });

    // Create System Message
    await tx.message.create({
      data: {
        orderId,
        userId,
        type: 'SYSTEM',
        content: `🚨 DISPUTE RAISED: ${reason}`
      }
    });

    return updatedOrder;
  });
}

/**
 * Delete an order
 */
export async function deleteOrder(orderId: string, userId: string, userRole: 'CREATOR' | 'ADMIN') {
  const order = await prisma.order.findUnique({
    where: { id: orderId }
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Permission check
  if (userRole !== 'ADMIN' && order.creatorId !== userId) {
    throw new Error('Access denied');
  }

  // Status check: Can only delete if OPEN or APPLIED (no active work/money yet)
  const deletableStatuses: OrderStatus[] = [OrderStatus.OPEN, OrderStatus.APPLIED];
  if (!deletableStatuses.includes(order.status as OrderStatus) && userRole !== 'ADMIN') {
    throw new Error('Cannot delete order in progress. Please contact support or cancel instead.');
  }

  // Delete
  return prisma.order.delete({
    where: { id: orderId }
  });
}

/**
 * Log Editor Activity to prevent false penalties
 */
export async function logEditorActivity(orderId: string, userId: string, type: string, metadata?: any) {
    const profile = await prisma.editorProfile.findUnique({ where: { userId } });
    if (!profile) return;

    return await (prisma as any).editorActivity.create({
        data: {
            orderId,
            userId,
            profileId: profile.id,
            type,
            metadata: metadata ? JSON.stringify(metadata) : undefined
        }
    });
}
