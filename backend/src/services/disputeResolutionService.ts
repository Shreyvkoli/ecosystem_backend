/**
 * Dispute Auto-Resolution Service
 * 
 * Evidence-based automated dispute resolution system.
 * 
 * Resolution Tiers:
 * 1. AUTO_RESOLVE — Clear evidence points to one party
 * 2. ADMIN_REVIEW — Mixed evidence, needs human judgment
 * 3. SPLIT_50_50 — No clear proof, both share loss
 * 
 * Evidence Sources:
 * - Revision count (from order)
 * - Message/comment history (from messages)
 * - File submission history (from files)
 * - Deadline adherence (from order)
 * - Activity logs (from editorActivity)
 */

import { PrismaClient } from '@prisma/client';
import { LedgerService, AccountType } from './ledgerService.js';
import { NotificationService } from './notificationService.js';

const prisma = new PrismaClient();

export type DisputeResolution = 
  | 'FAVOR_EDITOR' 
  | 'FAVOR_CREATOR' 
  | 'SPLIT_50_50' 
  | 'AUTO_RESOLVED_EDITOR'
  | 'AUTO_RESOLVED_CREATOR'
  | 'REQUIRES_ADMIN';

export interface DisputeEvidence {
  revisionCount: number;
  previewsSubmitted: number;
  editorMessagesCount: number;
  creatorMessagesCount: number;
  deadlineMissedByHours: number | null;
  lastEditorActivityHoursAgo: number | null;
  hasTimestampComments: boolean;
  orderAmount: number;
  editorDepositAmount: number;
}

export interface AutoResolutionResult {
  resolution: DisputeResolution;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  evidence: DisputeEvidence;
  reasoning: string;
}

/**
 * Gather all evidence for a dispute
 */
async function gatherEvidence(orderId: string): Promise<DisputeEvidence> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      files: true,
      messages: true,
    }
  });

  if (!order) throw new Error('Order not found');

  // Count previews submitted by editor
  const previewsSubmitted = order.files.filter(f => 
    f.type === 'PREVIEW_VIDEO' || f.type === 'FINAL_VIDEO'
  ).length;

  // Count messages by party
  const editorMessagesCount = order.messages.filter(m => 
    m.userId === order.editorId && m.type !== 'SYSTEM'
  ).length;

  const creatorMessagesCount = order.messages.filter(m => 
    m.userId === order.creatorId && m.type !== 'SYSTEM'
  ).length;

  // Check for timestamp comments (structured feedback)
  const hasTimestampComments = order.messages.some(m => 
    m.type === 'TIMESTAMP_COMMENT'
  );

  // Deadline analysis
  let deadlineMissedByHours: number | null = null;
  if (order.deadline) {
    const deadlineDate = new Date(order.deadline);
    const now = new Date();
    if (now > deadlineDate) {
      deadlineMissedByHours = Math.round((now.getTime() - deadlineDate.getTime()) / (1000 * 60 * 60));
    }
  }

  // Last editor activity
  let lastEditorActivityHoursAgo: number | null = null;
  try {
    const lastActivity = await (prisma as any).editorActivity.findFirst({
      where: { orderId, userId: order.editorId },
      orderBy: { createdAt: 'desc' }
    });
    if (lastActivity) {
      lastEditorActivityHoursAgo = Math.round(
        (Date.now() - new Date(lastActivity.createdAt).getTime()) / (1000 * 60 * 60)
      );
    }
  } catch (e) {
    // editorActivity table might not exist, skip gracefully
  }

  // Editor deposit
  let editorDepositAmount = 0;
  try {
    const deposit = await prisma.editorDeposit.findFirst({
      where: { orderId, editorId: order.editorId!, status: 'PAID' }
    });
    if (deposit) editorDepositAmount = deposit.amount;
  } catch (e) {}

  return {
    revisionCount: order.revisionCount || 0,
    previewsSubmitted,
    editorMessagesCount,
    creatorMessagesCount,
    deadlineMissedByHours,
    lastEditorActivityHoursAgo,
    hasTimestampComments,
    orderAmount: order.amount || 0,
    editorDepositAmount,
  };
}

/**
 * Analyze evidence and determine auto-resolution
 */
export function analyzeEvidence(evidence: DisputeEvidence): AutoResolutionResult {
  // Rule 1: Editor NEVER submitted any preview — clear ghosting
  if (evidence.previewsSubmitted === 0) {
    return {
      resolution: 'AUTO_RESOLVED_CREATOR',
      confidence: 'HIGH',
      evidence,
      reasoning: 'Editor never submitted any preview. Clear case of job abandonment.'
    };
  }

  // Rule 2: Editor missed deadline by 48h+ with no activity
  if (evidence.deadlineMissedByHours !== null && evidence.deadlineMissedByHours >= 48) {
    if (evidence.lastEditorActivityHoursAgo === null || evidence.lastEditorActivityHoursAgo >= 48) {
      return {
        resolution: 'AUTO_RESOLVED_CREATOR',
        confidence: 'HIGH',
        evidence,
        reasoning: `Editor missed deadline by ${evidence.deadlineMissedByHours}h with no recent activity. Clear negligence.`
      };
    }
  }

  // Rule 3: Editor did 3+ revisions and creator STILL rejects — favor editor
  if (evidence.revisionCount >= 3 && evidence.previewsSubmitted >= 3) {
    return {
      resolution: 'AUTO_RESOLVED_EDITOR',
      confidence: 'HIGH',
      evidence,
      reasoning: `Editor completed ${evidence.revisionCount} revisions with ${evidence.previewsSubmitted} submissions. Creator appears to be making unreasonable demands.`
    };
  }

  // Rule 4: Editor submitted work + has messages, but deadline missed slightly (< 48h)
  if (evidence.deadlineMissedByHours !== null && evidence.deadlineMissedByHours < 48 && evidence.previewsSubmitted >= 1) {
    return {
      resolution: 'REQUIRES_ADMIN',
      confidence: 'MEDIUM',
      evidence,
      reasoning: `Editor has submitted work but missed deadline by ${evidence.deadlineMissedByHours}h. Needs admin judgment on quality.`
    };
  }

  // Rule 5: Both parties active, some work done — needs admin
  if (evidence.previewsSubmitted >= 1 && evidence.editorMessagesCount >= 2 && evidence.creatorMessagesCount >= 2) {
    return {
      resolution: 'REQUIRES_ADMIN',
      confidence: 'MEDIUM',
      evidence,
      reasoning: 'Both parties were active and communicating. Work was submitted. Requires human review of quality.'
    };
  }

  // Rule 6: Low activity from both sides — 50/50 split
  if (evidence.editorMessagesCount <= 1 && evidence.creatorMessagesCount <= 1) {
    return {
      resolution: 'SPLIT_50_50',
      confidence: 'LOW',
      evidence,
      reasoning: 'Minimal communication from both parties. No clear evidence of fault. Defaulting to 50/50 split.'
    };
  }

  // Default: Needs admin review
  return {
    resolution: 'REQUIRES_ADMIN',
    confidence: 'LOW',
    evidence,
    reasoning: 'Mixed signals. Auto-resolution not confident enough. Requires admin review.'
  };
}

/**
 * Execute the resolution — transfer funds accordingly
 */
export async function executeResolution(
  disputeId: string,
  resolution: DisputeResolution,
  reasoning: string,
  adminId?: string
): Promise<any> {
  const dispute = await (prisma as any).dispute.findUnique({
    where: { id: disputeId },
    include: { order: true }
  });

  if (!dispute) throw new Error('Dispute not found');

  const order = dispute.order;
  if (!order.editorId || !order.amount) throw new Error('Order data incomplete');

  return prisma.$transaction(async (tx) => {
    let creatorRefund = 0;
    let editorPayout = 0;
    const platformFee = Math.round(order.amount * 0.10);

    // Determine fund distribution
    switch (resolution) {
      case 'FAVOR_CREATOR':
      case 'AUTO_RESOLVED_CREATOR': {
        // Full refund to creator, editor deposit forfeited
        creatorRefund = order.amount;
        editorPayout = 0;

        if (order.paymentStatus === 'PAID') {
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.CREATOR_WALLET + order.creatorId,
            amount: creatorRefund,
            transactionType: 'REFUND',
            orderId: order.id,
            idempotencyKey: `dispute_refund_${disputeId}`,
            prismaTx: tx
          });
        }

        // Forfeit editor deposit to platform
        const deposit = await tx.editorDeposit.findFirst({
          where: { orderId: order.id, editorId: order.editorId, status: 'PAID' }
        });
        if (deposit) {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.PLATFORM_REVENUE,
            amount: deposit.amount,
            transactionType: 'DEPOSIT_FORFEIT',
            orderId: order.id,
            idempotencyKey: `dispute_forfeit_${disputeId}`,
            prismaTx: tx
          });

          await (tx as any).editorDeposit.update({
            where: { id: deposit.id },
            data: { status: 'FORFEITED' }
          });
        }
        break;
      }

      case 'FAVOR_EDITOR':
      case 'AUTO_RESOLVED_EDITOR': {
        // Editor gets full payout + deposit back
        editorPayout = order.amount - platformFee;

        if (order.paymentStatus === 'PAID') {
          // Editor earnings
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.EDITOR_WALLET + order.editorId,
            amount: editorPayout,
            transactionType: 'PAYOUT',
            orderId: order.id,
            idempotencyKey: `dispute_payout_${disputeId}`,
            prismaTx: tx
          });

          // Platform fee
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.PLATFORM_REVENUE,
            amount: platformFee,
            transactionType: 'FEE_COLLECTION',
            orderId: order.id,
            idempotencyKey: `dispute_fee_${disputeId}`,
            prismaTx: tx
          });
        }

        // Refund editor deposit
        const deposit = await tx.editorDeposit.findFirst({
          where: { orderId: order.id, editorId: order.editorId, status: 'PAID' }
        });
        if (deposit) {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.EDITOR_WALLET + order.editorId,
            amount: deposit.amount,
            transactionType: 'DEPOSIT_REFUND',
            orderId: order.id,
            idempotencyKey: `dispute_dep_refund_${disputeId}`,
            prismaTx: tx
          });
        }
        break;
      }

      case 'SPLIT_50_50': {
        // 50% refund to creator, 50% to editor (minus platform fee from editor's share)
        const halfAmount = Math.round(order.amount / 2);
        creatorRefund = halfAmount;
        const editorHalf = order.amount - halfAmount;
        const editorFee = Math.round(editorHalf * 0.10);
        editorPayout = editorHalf - editorFee;

        if (order.paymentStatus === 'PAID') {
          // Creator gets 50%
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.CREATOR_WALLET + order.creatorId,
            amount: creatorRefund,
            transactionType: 'REFUND',
            orderId: order.id,
            idempotencyKey: `dispute_split_creator_${disputeId}`,
            prismaTx: tx
          });

          // Editor gets 50% minus fee
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.EDITOR_WALLET + order.editorId,
            amount: editorPayout,
            transactionType: 'PAYOUT',
            orderId: order.id,
            idempotencyKey: `dispute_split_editor_${disputeId}`,
            prismaTx: tx
          });

          // Platform fee on editor's share
          await LedgerService.transfer({
            from: AccountType.ESCROW_HOLDING + order.id,
            to: AccountType.PLATFORM_REVENUE,
            amount: editorFee,
            transactionType: 'FEE_COLLECTION',
            orderId: order.id,
            idempotencyKey: `dispute_split_fee_${disputeId}`,
            prismaTx: tx
          });
        }

        // Refund editor deposit (50/50 means no full fault)
        const deposit = await tx.editorDeposit.findFirst({
          where: { orderId: order.id, editorId: order.editorId, status: 'PAID' }
        });
        if (deposit) {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.EDITOR_WALLET + order.editorId,
            amount: deposit.amount,
            transactionType: 'DEPOSIT_REFUND',
            orderId: order.id,
            idempotencyKey: `dispute_split_dep_${disputeId}`,
            prismaTx: tx
          });
        }
        break;
      }

      default:
        throw new Error(`Cannot execute resolution: ${resolution}`);
    }

    // Update dispute record
    const resolvedDispute = await (tx as any).dispute.update({
      where: { id: disputeId },
      data: {
        status: resolution.startsWith('AUTO_') ? resolution : `RESOLVED_${resolution}`,
        resolutionNote: reasoning,
        adminId: adminId || 'SYSTEM',
        resolvedAt: new Date()
      }
    });

    // Update order status
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        isDisputed: true,
        lastActivityAt: new Date()
      }
    });

    // Notify both parties
    const notifService = NotificationService.getInstance();

    const resolutionLabel = resolution.includes('CREATOR') ? 'in your favor' 
      : resolution.includes('EDITOR') ? 'in editor\'s favor' 
      : 'split 50/50';

    await tx.notification.create({
      data: {
        userId: order.creatorId,
        type: 'SYSTEM',
        title: `Dispute Resolved ⚖️`,
        message: `Dispute for "${order.title}" resolved ${resolutionLabel}. ${creatorRefund > 0 ? `₹${creatorRefund} refunded to your wallet.` : ''}`,
        link: `/orders/${order.id}`
      }
    });

    await tx.notification.create({
      data: {
        userId: order.editorId,
        type: 'SYSTEM',
        title: `Dispute Resolved ⚖️`,
        message: `Dispute for "${order.title}" resolved ${resolutionLabel}. ${editorPayout > 0 ? `₹${editorPayout} credited to your wallet.` : ''}`,
        link: `/editor/jobs/${order.id}`
      }
    });

    // System message in chat
    await tx.message.create({
      data: {
        orderId: order.id,
        userId: adminId || order.creatorId,
        type: 'SYSTEM',
        content: `⚖️ Dispute Resolved: ${resolutionLabel.toUpperCase()}\nReason: ${reasoning}`
      }
    });

    return resolvedDispute;
  });
}

/**
 * Main entry point: Attempt auto-resolution, fall back to admin if uncertain
 */
export async function attemptAutoResolution(disputeId: string): Promise<AutoResolutionResult> {
  const dispute = await (prisma as any).dispute.findUnique({
    where: { id: disputeId }
  });

  if (!dispute) throw new Error('Dispute not found');

  // Gather evidence
  const evidence = await gatherEvidence(dispute.orderId);

  // Analyze
  const result = analyzeEvidence(evidence);

  // Only auto-execute if confidence is HIGH
  if (result.confidence === 'HIGH' && result.resolution.startsWith('AUTO_')) {
    console.log(`[AutoDispute] Auto-resolving dispute ${disputeId}: ${result.resolution} (${result.reasoning})`);
    await executeResolution(disputeId, result.resolution, result.reasoning);
  } else {
    // Mark as needs admin review with evidence summary
    await (prisma as any).dispute.update({
      where: { id: disputeId },
      data: {
        autoAnalysis: JSON.stringify(result),
        status: 'PENDING'
      }
    });
    console.log(`[AutoDispute] Dispute ${disputeId} needs admin review: ${result.reasoning}`);
  }

  return result;
}
