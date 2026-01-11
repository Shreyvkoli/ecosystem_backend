import { PrismaClient } from '@prisma/client';
import { OrderStatus, ApplicationStatus, WalletTransactionType } from '../utils/enums.js';
import { sendEmail } from '../utils/email';

const prisma = new PrismaClient();

// Constants for edge case handling
const DEPOSIT_TIMEOUT_HOURS = 24;
const ORDER_ASSIGN_TIMEOUT_HOURS = 72;
const IN_PROGRESS_TIMEOUT_HOURS = 24;
const MAX_REVISIONS = 2;
const FILE_CLEANUP_DAYS = 14;
const GHOST_USER_DAYS = 7;

export class EdgeCaseService {

  /**
   * 1️⃣ Editor deposit pending logic
   * Auto-cancel applications without deposit after 24 hours
   */
  static async handleDepositTimeouts() {
    console.log('Checking deposit timeouts...');

    const expiredApplications = await prisma.orderApplication.findMany({
      where: {
        status: ApplicationStatus.APPLIED,
        depositDeadline: {
          lt: new Date()
        }
      },
      include: {
        editor: true,
        order: true
      }
    });

    for (const app of expiredApplications) {
      await prisma.$transaction(async (tx) => {
        // Cancel application
        await tx.orderApplication.update({
          where: { id: app.id },
          data: { status: ApplicationStatus.REJECTED }
        });

        // Update order status back to OPEN if no other applications
        const remainingApps = await tx.orderApplication.count({
          where: {
            orderId: app.orderId,
            status: ApplicationStatus.APPLIED
          }
        });

        if (remainingApps === 0) {
          await tx.order.update({
            where: { id: app.orderId },
            data: { status: OrderStatus.OPEN }
          });
        }

        // Send notification email
        await sendEmail({
          to: app.editor.email,
          subject: 'Application Cancelled - Deposit Timeout',
          template: 'deposit-timeout',
          data: {
            orderTitle: app.order.title,
            hours: DEPOSIT_TIMEOUT_HOURS
          }
        });
      });
    }

    console.log(`Processed ${expiredApplications.length} deposit timeouts`);
  }

  /**
   * 2️⃣ Order timeout logic
   * Handle various timeout scenarios
   */
  static async handleOrderTimeouts() {
    console.log('Checking order timeouts...');

    // Case 1: Creator created order but no editor assigned (72 hours)
    const unassignedOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.OPEN,
        createdAt: {
          lt: new Date(Date.now() - ORDER_ASSIGN_TIMEOUT_HOURS * 60 * 60 * 1000)
        }
      },
      include: { creator: true }
    });

    for (const order of unassignedOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          ...(process.env.NODE_ENV !== 'production' && { autoCancelAt: new Date() })
        }
      });

      await sendEmail({
        to: order.creator.email,
        subject: 'Order Auto-Cancelled - No Applications',
        template: 'order-cancelled-no-apps',
        data: { orderTitle: order.title }
      });
    }

    // Case 2: Editor assigned but didn't start work (24 hours)
    const notStartedOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.ASSIGNED,
        assignedAt: {
          lt: new Date(Date.now() - IN_PROGRESS_TIMEOUT_HOURS * 60 * 60 * 1000)
        }
      },
      include: { creator: true, editor: true }
    });

    for (const order of notStartedOrders) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            autoCancelAt: new Date()
          }
        });

        // Refund creator
        if (order.amount) {
          await tx.walletTransaction.create({
            data: {
              userId: order.creatorId,
              orderId: order.id,
              type: WalletTransactionType.DEPOSIT_RELEASE,
              amount: order.amount
            }
          });

          await tx.user.update({
            where: { id: order.creatorId },
            data: { walletBalance: { increment: order.amount } }
          });
        }

        // Slash editor deposit
        await tx.user.update({
          where: { id: order.editorId! },
          data: { walletLocked: { decrement: 500 } } // Assuming 500 deposit
        });
      });

      await sendEmail({
        to: order.editor!.email,
        subject: 'Order Cancelled - Work Not Started',
        template: 'editor-cancelled-no-work',
        data: { orderTitle: order.title }
      });
    }

    // Case 3: Deadline passed without submission
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.REVISION_REQUESTED] },
        deadline: {
          lt: new Date()
        }
      },
      include: { creator: true, editor: true }
    });

    for (const order of overdueOrders) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.CANCELLED,
          ...(process.env.NODE_ENV !== 'production' && { autoCancelAt: new Date() })
        }
      });

      await sendEmail({
        to: [order.creator.email, order.editor?.email].filter((email): email is string => Boolean(email)),
        subject: 'Order Cancelled - Deadline Passed',
        template: 'deadline-passed',
        data: { orderTitle: order.title }
      });
    }

    console.log(`Processed order timeouts: ${unassignedOrders.length + notStartedOrders.length + overdueOrders.length}`);
  }

  /**
   * 3️⃣ File storage cleanup
   * Clean up old files to save S3/R2 costs
   */
  static async cleanupOldFiles() {
    console.log('Starting file cleanup...');

    const cutoffDate = new Date(Date.now() - FILE_CLEANUP_DAYS * 24 * 60 * 60 * 1000);

    // Delete files from cancelled orders
    const cancelledOrderFiles = await prisma.file.findMany({
      where: {
        order: {
          status: OrderStatus.CANCELLED,
          updatedAt: { lt: cutoffDate }
        }
      }
    });

    // Delete old preview files (keep only latest)
    const oldPreviewFiles = await prisma.file.findMany({
      where: {
        type: 'PREVIEW_VIDEO',
        createdAt: { lt: cutoffDate }
      }
    });

    const filesToDelete = [...cancelledOrderFiles, ...oldPreviewFiles];

    for (const file of filesToDelete) {
      // TODO: Delete from S3/R2
      // await deleteFromS3(file.s3Key);

      await prisma.file.delete({
        where: { id: file.id }
      });
    }

    console.log(`Cleaned up ${filesToDelete.length} old files`);
  }

  /**
   * 4️⃣ Revision abuse control
   * Check if revision requests exceed limit
   */
  static async checkRevisionLimit(orderId: string, _userId: string): Promise<{ allowed: boolean; message: string }> {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return { allowed: false, message: 'Order not found' };
    }

    if ((order as any).revisionCount >= MAX_REVISIONS) {
      return {
        allowed: false,
        message: `Maximum ${MAX_REVISIONS} revisions allowed. Additional revisions require payment upgrade.`
      };
    }

    return { allowed: true, message: 'Revision request allowed' };
  }

  /**
   * 5️⃣ Communication gap detection
   * Find orders with no recent activity
   */
  static async detectCommunicationGaps() {
    console.log('Checking communication gaps...');

    const gapThreshold = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days

    const inactiveOrders = await prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED] },
        lastActivityAt: {
          lt: gapThreshold
        }
      },
      include: { creator: true, editor: true }
    });

    for (const order of inactiveOrders) {
      await sendEmail({
        to: [order.creator.email, order.editor?.email].filter((email): email is string => Boolean(email)),
        subject: 'Action Required - Order Inactivity',
        template: 'communication-gap',
        data: {
          orderTitle: order.title,
          daysSinceActivity: Math.floor((Date.now() - (order as any).lastActivityAt!.getTime()) / (24 * 60 * 60 * 1000))
        }
      });
    }

    console.log(`Found ${inactiveOrders.length} orders with communication gaps`);
  }

  /**
   * 6️⃣ Ghost user handling
   * Auto-cancel orders for ghost users
   */
  static async handleGhostUsers() {
    console.log('Checking for ghost users...');

    const ghostThreshold = new Date(Date.now() - GHOST_USER_DAYS * 24 * 60 * 60 * 1000);

    // Ghost editors (assigned but no activity)
    const ghostEditors = await prisma.order.findMany({
      where: {
        status: OrderStatus.ASSIGNED,
        lastActivityAt: {
          lt: ghostThreshold
        }
      },
      include: { creator: true, editor: true }
    });

    for (const order of ghostEditors) {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            ...(process.env.NODE_ENV !== 'production' && { autoCancelAt: new Date() })
          }
        });

        // Refund creator
        if (order.amount) {
          await tx.walletTransaction.create({
            data: {
              userId: order.creatorId,
              orderId: order.id,
              type: WalletTransactionType.DEPOSIT_RELEASE,
              amount: order.amount * 0.5 // Partial refund
            }
          });

          await tx.user.update({
            where: { id: order.creatorId },
            data: { walletBalance: { increment: order.amount * 0.5 } }
          });
        }

        // Slash editor deposit completely
        await tx.user.update({
          where: { id: order.editorId! },
          data: { walletLocked: { decrement: 500 } }
        });
      });
    }

    console.log(`Processed ${ghostEditors.length} ghost editor cases`);
  }

  /**
   * Main function to run all edge case checks
   */
  static async runAllChecks() {
    try {
      await this.handleDepositTimeouts();
      await this.handleOrderTimeouts();
      await this.cleanupOldFiles();
      await this.detectCommunicationGaps();
      await this.handleGhostUsers();
    } catch (error) {
      console.error('Edge case service error:', error);
    }
  }
}
