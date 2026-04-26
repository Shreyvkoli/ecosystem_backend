import express from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentStatus } from '../utils/enums.js';
import { z } from 'zod';
import { authenticate, AuthRequest, requireCreator, requireAdmin } from '../middleware/auth.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';
import { getRazorpay, verifyPaymentSignature, verifyWebhookSignature } from '../utils/razorpay.js';
import { getStripe } from '../utils/stripe.js';
import { LedgerService, AccountType } from '../services/ledgerService.js';

const router = express.Router();
router.use(idempotencyMiddleware);
const prisma = new PrismaClient();

function getGatewayFromCountryCode(countryCode?: string | null): 'RAZORPAY' | 'STRIPE' {
  return (countryCode || 'IN').toUpperCase() === 'IN' ? 'RAZORPAY' : 'STRIPE';
}

function mapCurrencyForGateway(currency: string | null | undefined, gateway: 'RAZORPAY' | 'STRIPE'): string {
  const cur = (currency || 'INR').toUpperCase();
  if (gateway === 'RAZORPAY') {
    return 'INR';
  }
  return cur;
}

function toMinorAmount(amount: number, currency: string): number {
  const cur = currency.toUpperCase();
  const zeroDecimal = new Set(['JPY', 'KRW']);
  if (zeroDecimal.has(cur)) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

/**
 * POST /api/payments/create-order
 * Create Razorpay order for payment (CREATOR only)
 * Creator pays upfront before order starts
 */
router.post('/create-order', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid('Invalid order ID'),
    });
    const { orderId } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        creatorId: req.userId!
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    if (!order.editorId) {
      return res.status(400).json({
        error: 'Cannot create payment until an editor is approved/assigned'
      });
    }

    if (order.editorDepositRequired && order.editorDepositStatus !== 'PAID') {
      return res.status(400).json({
        error: 'Editor deposit must be paid before creator payment can be made'
      });
    }

    if (!order.amount || order.amount <= 0) {
      return res.status(400).json({ error: 'Order amount not set' });
    }

    const creator = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { countryCode: true }
    } as any);

    const gateway = getGatewayFromCountryCode((creator as any)?.countryCode);
    const currency = mapCurrencyForGateway((order as any).currency, gateway);

    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId,
        kind: 'CREATOR_PAYMENT' as any,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING, PaymentStatus.COMPLETED] }
      }
    } as any);

    if (existingPayment) {
      return res.status(400).json({
        error: 'Payment already exists for this order',
        paymentId: existingPayment.id
      });
    }

    if (gateway === 'RAZORPAY') {
      const razorpay = getRazorpay();
      const razorpayOrder = await razorpay.orders.create({
        amount: toMinorAmount(order.amount, 'INR'),
        currency: 'INR',
        payment_capture: true,
        receipt: `ord_${orderId.slice(0, 8)}_${Date.now().toString().slice(-10)}`,
        notes: {
          orderId,
          userId: req.userId!,
          orderTitle: order.title,
          kind: 'CREATOR_PAYMENT'
        }
      });

      const payment = await prisma.payment.create({
        data: {
          orderId,
          userId: req.userId!,
          amount: order.amount,
          currency: 'INR',
          status: PaymentStatus.PENDING,
          razorpayOrderId: razorpayOrder.id,
          gateway: 'RAZORPAY' as any,
          kind: 'CREATOR_PAYMENT' as any
        } as any
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentGateway: 'RAZORPAY' as any, paymentStatus: 'PENDING' as any } as any
      });

      return res.json({
        gateway: 'razorpay',
        paymentId: payment.id,
        razorpayOrderId: razorpayOrder.id,
        amount: Number((razorpayOrder as any).amount) / 100,
        currency: (razorpayOrder as any).currency || 'INR',
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }

    return res.status(400).json({ error: 'Only Razorpay (INR) is supported at this time' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Create payment error:', error);
    if (
      typeof message === 'string' &&
      (message.includes('RAZORPAY_KEY_ID') || message.includes('STRIPE_SECRET_KEY'))
    ) {
      return res.status(500).json({ error: message });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/editor-deposit/create
 * Create editor deposit payment (EDITOR only)
 */
router.post('/editor-deposit/create', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId || req.userRole !== 'EDITOR') {
      return res.status(403).json({ error: 'Editors only' });
    }

    const schema = z.object({
      orderId: z.string().uuid('Invalid order ID')
    });

    const { orderId } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        editorId: req.userId!
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    if (!(order as any).editorDepositRequired) {
      return res.status(400).json({ error: 'Deposit not required for this order' });
    }

    if ((order as any).editorDepositStatus === 'PAID') {
      return res.status(400).json({ error: 'Deposit already paid' });
    }

    const editor = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { countryCode: true }
    } as any);

    // Force Razorpay for now since we are focusing on India
    let gateway: 'RAZORPAY' | 'STRIPE' = 'RAZORPAY';

    // Commented out Stripe logic for now as per user request
    /*
    let gateway = getGatewayFromCountryCode((editor as any)?.countryCode);

    // Fallback to Razorpay (Dummy) if Stripe keys are missing, to allow Dev Pay to work
    if (gateway === 'STRIPE' && !process.env.STRIPE_SECRET_KEY) {
      console.log('Stripe keys missing. Falling back to Razorpay Dummy flow for Dev/Test.');
      gateway = 'RAZORPAY';
    }
    */

    const depositAmount = gateway === 'RAZORPAY' ? 500 : 10;
    const depositCurrency = gateway === 'RAZORPAY' ? 'INR' : 'USD';

    const existingDeposit = await prisma.editorDeposit.findFirst({
      where: {
        orderId,
        editorId: req.userId!,
        status: { in: ['PENDING', 'PAID'] }
      }
    });

    if (existingDeposit) {
      // If pending, clear it to allow new attempt
      await (prisma as any).editorDeposit.delete({ where: { id: existingDeposit.id } });
    }

    if (gateway === 'RAZORPAY') {
      let razorpayOrderId = `dummy_order_${Date.now()}`;

      // Check if keys exist. If not, we are likely in dev/test mode without keys.
      // We generate a dummy order ID so the "Dev Pay" button still works.
      const hasKeys = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

      if (!hasKeys) {
        throw new Error('Razorpay keys are missing in backend environment');
      }

      const razorpay = getRazorpay();
      try {
        console.log('Attempting to create Razorpay Order with:', {
          amount: toMinorAmount(depositAmount, 'INR'),
          currency: 'INR',
          receipt: `dep_${orderId.slice(0, 8)}_${Date.now().toString().slice(-10)}`,
          keyIdPrefix: process.env.RAZORPAY_KEY_ID?.substring(0, 5)
        });

        const razorpayOrder = await razorpay.orders.create({
          amount: toMinorAmount(depositAmount, 'INR'),
          currency: 'INR',
          payment_capture: true,
          // Receipt max length is 40. UUID is 36. So we must shorten it.
          // Using 'dep_' + first 10 of order + last 10 of timestamp
          receipt: `dep_${orderId.slice(0, 8)}_${Date.now().toString().slice(-10)}`,
          notes: {
            orderId,
            userId: req.userId!,
            kind: 'EDITOR_DEPOSIT'
          }
        });
        razorpayOrderId = razorpayOrder.id;
        console.log('Razorpay Order Created Success:', razorpayOrderId);
      } catch (rzpError: any) {
        console.error('Razorpay Order Creation FAILED FULL:', JSON.stringify(rzpError, null, 2));
        throw new Error('Failed to communicate with Razorpay: ' + (rzpError.error?.description || rzpError.message));
      }

      /*
      if (hasKeys) {
        ...
      }
      */

      const deposit = await (prisma as any).editorDeposit.create({
        data: {
          orderId,
          editorId: req.userId!,
          amount: depositAmount,
          currency: 'INR',
          gateway: 'RAZORPAY',
          status: 'PENDING',
          razorpayOrderId: razorpayOrderId
        }
      });

      await prisma.order.update({
        where: { id: orderId },
        data: { editorDepositStatus: 'PENDING' as any } as any
      });

      return res.json({
        gateway: 'razorpay',
        editorDepositId: deposit.id,
        razorpayOrderId: razorpayOrderId,
        amount: depositAmount,
        currency: 'INR',
        keyId: process.env.RAZORPAY_KEY_ID
      });
    }

    return res.status(400).json({ error: 'Only Razorpay (INR) is supported at this time' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('Create editor deposit error FULL:', error);
    // Return actual error message for debugging
    return res.status(500).json({ error: `Server Error: ${message}` });
  }
});

/**
 * POST /api/payments/editor-deposit/verify
 * Verify Razorpay editor deposit from client
 */
router.post('/editor-deposit/verify', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId || req.userRole !== 'EDITOR') {
      return res.status(403).json({ error: 'Editors only' });
    }

    const schema = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string()
    });

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = schema.parse(req.body);

    const deposit = await (prisma as any).editorDeposit.findFirst({
      where: {
        razorpayOrderId,
        editorId: req.userId!
      }
    });

    if (!deposit) {
      return res.status(404).json({ error: 'Deposit not found' });
    }

    // Bypass for Dev Mode
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    if (isDev && razorpaySignature === 'dummy_signature_dev_mode') {
      // Skip signature verify & Razorpay fetch
      // Proceed to update DB directly
      console.log('⚠️ DEV MODE: Bypassing Editor Deposit Signature Verification');
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET is not configured' });
      }

      const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature, secret);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      const razorpay = getRazorpay();
      const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);
      if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
        return res.status(400).json({ error: `Payment not successful. Status: ${razorpayPayment.status}` });
      }

      if (razorpayPayment.order_id !== razorpayOrderId) {
        return res.status(400).json({ error: 'Payment order ID mismatch' });
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 1. Ledger Transfer
        await LedgerService.transfer({
          from: AccountType.GATEWAY_EXTERNAL,
          to: AccountType.ESCROW_HOLDING + deposit.orderId,
          amount: deposit.amount,
          transactionType: 'EDITOR_DEPOSIT_LOCK',
          orderId: deposit.orderId,
          idempotencyKey: `ed_deposit_${deposit.id}`,
          prismaTx: tx
        });

        // 2. Update Deposit
        const updatedDeposit = await (tx as any).editorDeposit.update({
          where: { id: deposit.id },
          data: {
            razorpayPaymentId,
            razorpaySignature,
            status: 'PAID',
            processedAt: new Date()
          }
        });

        // 3. Update Order
        await tx.order.update({
          where: { id: updatedDeposit.orderId },
          data: { editorDepositStatus: 'PAID' as any } as any
        });

        return updatedDeposit;
      });

      return res.json({ success: true, deposit: result });
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        return res.json({ success: true, message: 'Deposit already processed' });
      }
      throw error;
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.errors });
    }
    console.error('Verify editor deposit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/verify
 * Verify payment from client (after Razorpay checkout)
 * Marks payment as COMPLETED (money received but not released)
 */
router.post('/verify', authenticate, requireCreator, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      razorpayOrderId: z.string(),
      razorpayPaymentId: z.string(),
      razorpaySignature: z.string()
    });

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = schema.parse(req.body);

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId,
        userId: req.userId!,
        order: {
          creatorId: req.userId!
        }
      },
      include: {
        order: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify payment signature
    // STRICT SECURITY: Only allow dummy signature in DEVELOPMENT or TEST mode.
    const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

    if (isDev && razorpaySignature === 'dummy_signature_dev_mode') {
      console.log('⚠️ DEV MODE: Bypassing Razorpay Signature Verification');
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        return res.status(500).json({ error: 'RAZORPAY_KEY_SECRET is not configured' });
      }
      const isValid = verifyPaymentSignature(
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        secret
      );

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid payment signature' });
      }

      // Verify payment status with Razorpay
      try {
        const razorpay = getRazorpay();
        const razorpayPayment = await razorpay.payments.fetch(razorpayPaymentId);

        if (razorpayPayment.status !== 'captured' && razorpayPayment.status !== 'authorized') {
          return res.status(400).json({
            error: `Payment not successful. Status: ${razorpayPayment.status}`
          });
        }

        if (razorpayPayment.order_id !== razorpayOrderId) {
          return res.status(400).json({ error: 'Payment order ID mismatch' });
        }
      } catch (razorpayError: any) {
        console.error('Razorpay payment fetch error:', razorpayError);
        return res.status(400).json({
          error: 'Failed to verify payment with Razorpay',
          details: razorpayError.message
        });
      }
    }

    // Update payment, order and ledger in one transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ledger Transfer
      await LedgerService.transfer({
        from: AccountType.GATEWAY_EXTERNAL,
        to: AccountType.ESCROW_HOLDING + payment.orderId,
        amount: payment.amount,
        transactionType: 'DEPOSIT',
        orderId: payment.orderId,
        idempotencyKey: `deposit_${payment.id}`,
        prismaTx: tx
      });

      // 2. Update Payment
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: {
          razorpayPaymentId,
          razorpaySignature,
          status: PaymentStatus.COMPLETED,
          processedAt: new Date()
        },
        include: {
          order: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      // 3. Update Order
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          paymentGateway: 'RAZORPAY' as any,
          paymentStatus: 'PAID' as any,
          payoutStatus: 'PENDING' as any
        } as any
      });

      return updatedPayment;
    });

    const updated = result;

    // --- Notification Logic ---
    const { NotificationService } = await import('../services/notificationService.js');
    const notifService = NotificationService.getInstance();
    const updatedOrder = await prisma.order.findUnique({ where: { id: payment.orderId }, include: { editor: true } });

    // 1. Notify Creator
    await notifService.createAndSend({
      userId: req.userId!,
      type: 'SYSTEM',
      title: 'Payment Successful',
      message: `Your payment of ₹${payment.amount} for "${updatedOrder?.title}" was successful.`,
      link: `/orders/${payment.orderId}`
    });

    // 2. Notify Editor (if assigned)
    if (updatedOrder?.editorId) {
      await notifService.createAndSend({
        userId: updatedOrder.editorId,
        type: 'SYSTEM',
        title: 'Payment Secured',
        message: `Creator has deposited ₹${payment.amount} into Escrow. You can proceed with confidence!`,
        link: `/editor/jobs/${payment.orderId}`
      });
    }

    // 3. System Chat Message
    await prisma.message.create({
      data: {
        orderId: payment.orderId,
        userId: req.userId!, // Sent by Creator (as system action)
        type: 'SYSTEM',
        content: `💰 Payment of ₹${payment.amount} secured in Escrow!`
      }
    });
    // --------------------------

    return res.json({
      success: true,
      payment: updated,
      message: 'Payment verified successfully.'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.errors
      });
    }
    console.error('Verify payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler (no auth required - uses signature verification)
 * Handles payment events from Razorpay
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    const body = req.body.toString();
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'RAZORPAY_WEBHOOK_SECRET/RAZORPAY_KEY_SECRET not configured' });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature, secret);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    // Handle payment.captured event
    if (eventType === 'payment.captured') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      // Find payment by Razorpay order ID
      const payment = await prisma.payment.findUnique({
        where: {
          razorpayOrderId: orderId
        }
      });

      if (payment && payment.status === PaymentStatus.PENDING) {
        try {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.ESCROW_HOLDING + payment.orderId,
            amount: payment.amount,
            transactionType: 'DEPOSIT',
            orderId: payment.orderId,
            idempotencyKey: `deposit_${payment.id}`
          });
        } catch (e) { }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: PaymentStatus.COMPLETED,
            processedAt: new Date()
          }
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: {
            paymentGateway: 'RAZORPAY' as any,
            paymentStatus: 'PAID' as any
          } as any
        });
      }

      const deposit = await (prisma as any).editorDeposit.findUnique({
        where: { razorpayOrderId: orderId }
      } as any);
      if (deposit && (deposit as any).status === 'PENDING') {
        try {
          await LedgerService.transfer({
            from: AccountType.GATEWAY_EXTERNAL,
            to: AccountType.ESCROW_HOLDING + (deposit as any).orderId,
            amount: (deposit as any).amount,
            transactionType: 'EDITOR_DEPOSIT_LOCK',
            orderId: (deposit as any).orderId,
            idempotencyKey: `ed_deposit_${(deposit as any).id}`
          });
        } catch (e) { }

        await (prisma as any).editorDeposit.update({
          where: { id: (deposit as any).id },
          data: {
            razorpayPaymentId: paymentEntity.id,
            status: 'PAID' as any,
            processedAt: new Date()
          } as any
        });
        await prisma.order.update({
          where: { id: (deposit as any).orderId },
          data: { editorDepositStatus: 'PAID' as any } as any
        });
      }
    }

    // Handle payment.failed event
    if (eventType === 'payment.failed') {
      const paymentEntity = event.payload.payment.entity;
      const orderId = paymentEntity.order_id;

      const payment = await prisma.payment.findFirst({
        where: {
          razorpayOrderId: orderId
        }
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED
          }
        });

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: 'FAILED' as any } as any
        });
      }

      const deposit = await (prisma as any).editorDeposit.findFirst({
        where: { razorpayOrderId: orderId }
      } as any);
      if (deposit) {
        await (prisma as any).editorDeposit.update({
          where: { id: (deposit as any).id },
          data: { status: 'PENDING' as any } as any
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/payments/stripe/webhook
 * Stripe webhook handler
 */
router.post('/stripe/webhook', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'] as string | undefined;
    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'STRIPE_WEBHOOK_SECRET not configured' });
    }

    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(req.body, sig, secret);

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as any;
      const kind = intent.metadata?.kind;

      if (kind === 'CREATOR_PAYMENT') {
        const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: intent.id } } as any);
        if (payment && payment.status !== PaymentStatus.COMPLETED) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: { status: PaymentStatus.COMPLETED, processedAt: new Date() }
          });
          await prisma.order.update({
            where: { id: payment.orderId },
            data: { paymentGateway: 'STRIPE' as any, paymentStatus: 'PAID' as any, payoutStatus: 'PENDING' as any } as any
          });
        }
      }

      if (kind === 'EDITOR_DEPOSIT') {
        const deposit = await (prisma as any).editorDeposit.findFirst({ where: { stripePaymentIntentId: intent.id } });
        if (deposit && deposit.status !== 'PAID') {
          await (prisma as any).editorDeposit.update({ where: { id: deposit.id }, data: { status: 'PAID', processedAt: new Date() } });
          await prisma.order.update({ where: { id: deposit.orderId }, data: { editorDepositStatus: 'PAID' as any } as any });
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as any;
      const kind = intent.metadata?.kind;

      if (kind === 'CREATOR_PAYMENT') {
        const payment = await prisma.payment.findFirst({ where: { stripePaymentIntentId: intent.id } } as any);
        if (payment) {
          await prisma.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.FAILED } });
          await prisma.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'FAILED' as any } as any });
        }
      }

      if (kind === 'EDITOR_DEPOSIT') {
        const deposit = await (prisma as any).editorDeposit.findFirst({ where: { stripePaymentIntentId: intent.id } });
        if (deposit) {
          await (prisma as any).editorDeposit.update({ where: { id: deposit.id }, data: { status: 'PENDING' } });
        }
      }
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('Stripe webhook error:', error);
    return res.status(400).json({ error: 'Webhook error', details: error.message });
  }
});

/**
 * POST /api/payments/:paymentId/release
 * Manually release payment to editor (ADMIN only)
 * Money is marked as released but actual transfer handled by Razorpay separately
 */
router.post('/:paymentId/release', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      releaseNote: z.string().max(500).optional()
    });
    const { releaseNote } = schema.parse(req.body ?? {});

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        order: {
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
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      return res.status(400).json({
        error: `Payment cannot be released. Current status: ${payment.status}`
      });
    }

    if ((payment as any).releasedAt) {
      return res.status(400).json({ error: 'Payment already marked as released' });
    }

    // Logic: Calculate Platform Fee (e.g., 10%)
    const platformFeePercent = 0.10;
    const platformFee = payment.amount * platformFeePercent;
    const editorAmount = payment.amount - platformFee;

    const autoNote = `Released ${payment.currency} ${editorAmount.toFixed(2)} to Editor. Platform Fee: ${payment.currency} ${platformFee.toFixed(2)} (10%).`;
    const finalNote = releaseNote ? `${releaseNote} | ${autoNote}` : autoNote;

    // For MVP: Just mark as released
    // In production, you would initiate Razorpay payout/transfer here
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        ...({ releasedAt: new Date(), releaseNote: finalNote } as any)
      } as any,
      include: {
        order: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    return res.json({
      success: true,
      payment: updated,
      message: 'Payment marked as released. Actual transfer should be processed via Razorpay.'
    });
  } catch (error) {
    console.error('Release payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/admin/list
 * Admin list payments (ADMIN only)
 */
router.get('/admin/list', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const released = typeof req.query.released === 'string' ? req.query.released : undefined;

    const payments = await prisma.payment.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(released === 'true' ? { releasedAt: { not: null } } : {}),
        ...(released === 'false' ? { releasedAt: null } : {})
      } as any,
      include: {
        order: {
          select: {
            id: true,
            title: true,
            status: true,
            creatorId: true,
            editorId: true
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(payments);
  } catch (error) {
    console.error('Admin list payments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/order/:orderId
 * Get all payments for an order
 */
router.get('/order/:orderId', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify order access
    const order = await prisma.order.findFirst({
      where: {
        id: req.params.orderId,
        OR: [
          { creatorId: req.userId },
          { editorId: req.userId }
        ]
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    const payments = await prisma.payment.findMany({
      where: { orderId: req.params.orderId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/:id
 * Get payment details
 */
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
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
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Verify access
    if (
      payment.order.creatorId !== req.userId &&
      payment.order.editorId !== req.userId &&
      req.userRole !== 'ADMIN'
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    return res.json(payment);
  } catch (error) {
    console.error('Get payment error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/dispute
 * Freeze an order when a dispute is raised
 */
router.post('/dispute', authenticate, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      reason: z.string().min(5)
    });
    const { orderId, reason } = schema.parse(req.body);

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Not found' });

    if (order.creatorId !== req.userId && order.editorId !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if ((order as any).isDisputed) {
      return res.status(400).json({ error: 'Order already disputed' });
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'DISPUTED' as any,
        isDisputed: true,
        disputeReason: reason,
        disputeCreatedAt: new Date()
      } as any
    });

    return res.json({ success: true, order: updated });
  } catch (e) {
    console.error("Dispute error:", e);
    return res.status(500).json({ error: 'Server err' });
  }
});

/**
 * POST /api/payments/dispute/resolve
 * Admin split payout execution
 */
router.post('/dispute/resolve', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      creatorPercentage: z.number().min(0).max(100),
      editorPercentage: z.number().min(0).max(100)
    });
    const { orderId, creatorPercentage, editorPercentage } = schema.parse(req.body);

    if (creatorPercentage + editorPercentage !== 100) {
      return res.status(400).json({ error: 'Percentages must sum to 100' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.status !== 'DISPUTED') {
      return res.status(400).json({ error: 'Order not found or not disputed' });
    }

    const totalPool = order.amount || 0;

    const result = await prisma.$transaction(async (tx) => {
      // Admin split logic using immutable LedgerService
      const creatorRefund = (totalPool * creatorPercentage) / 100;
      const editorPayout = (totalPool * editorPercentage) / 100;

      if (creatorRefund > 0) {
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + orderId,
          to: AccountType.CREATOR_WALLET + order.creatorId,
          amount: creatorRefund,
          transactionType: 'DISPUTE_REFUND',
          orderId: orderId,
          idempotencyKey: `disp_ref_${orderId}`,
          prismaTx: tx
        });
      }

      if (editorPayout > 0 && order.editorId) {
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + orderId,
          to: AccountType.EDITOR_WALLET + order.editorId,
          amount: editorPayout,
          transactionType: 'DISPUTE_PAYOUT',
          orderId: orderId,
          idempotencyKey: `disp_pay_${orderId}`,
          prismaTx: tx
        });
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status: 'COMPLETED' as any,
          completedAt: new Date()
        } as any
      });
    });

    return res.json({ success: true, order: result });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/payments/admin/disputes
 * Admin fetches all orders currently in dispute
 */
router.get('/admin/disputes', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const disputes = await prisma.order.findMany({
      where: { isDisputed: true },
      include: {
        creator: { select: { name: true, email: true } },
        editor: { select: { name: true, email: true } }
      }
    });
    return res.json(disputes);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

/**
 * POST /api/payments/admin/resolve-dispute
 * Admin manually resolves an escrow dispute with a custom split
 */
router.post('/admin/resolve-dispute', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      orderId: z.string().uuid(),
      creatorRefund: z.number().min(0),
      editorPayout: z.number().min(0),
      adminNote: z.string()
    });

    const { orderId, creatorRefund, editorPayout, adminNote } = schema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || !order.isDisputed) {
      return res.status(400).json({ error: 'Order not found or not in dispute' });
    }

    if (!order.amount || creatorRefund + editorPayout > order.amount) {
      return res.status(400).json({ error: 'Total split exceeds order escrow amount' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Creator Refund
      if (creatorRefund > 0) {
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order.id,
          to: AccountType.CREATOR_WALLET + order.creatorId,
          amount: creatorRefund,
          transactionType: 'DISPUTE_REFUND',
          orderId: order.id,
          idempotencyKey: `dispute_refund_${order.id}`,
          prismaTx: tx
        });
      }

      // 2. Editor Payout
      if (editorPayout > 0 && order.editorId) {
        await LedgerService.transfer({
          from: AccountType.ESCROW_HOLDING + order.id,
          to: AccountType.EDITOR_WALLET + order.editorId,
          amount: editorPayout,
          transactionType: 'DISPUTE_PAYOUT',
          orderId: order.id,
          idempotencyKey: `dispute_payout_${order.id}`,
          prismaTx: tx
        });
      }

      // 3. Close Order
      const updatedOrder = await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'COMPLETED',
          isDisputed: false,
          disputeReason: `RESOLVED: ${adminNote}`
        }
      });

      return updatedOrder;
    });

    return res.json(result);
  } catch (error: any) {
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    console.error('Resolve Dispute Error:', error);
    return res.status(500).json({ error: 'Resolution failed' });
  }
});

/**
 * GET /api/payments/admin/audit
 * Admin liquidity audit to verify system-wide financial integrity
 */
router.get('/admin/audit', authenticate, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const [wallets, locked, escrowEntries, platformRevenue] = await Promise.all([
      prisma.user.aggregate({ _sum: { walletBalance: true } }),
      prisma.user.aggregate({ _sum: { walletLocked: true } }),
      (prisma as any).ledgerEntry.aggregate({
        where: { accountTo: { startsWith: 'ESCROW_' } },
        _sum: { amount: true }
      }),
      (prisma as any).ledgerEntry.aggregate({
        where: { accountTo: 'PLATFORM_REVENUE' },
        _sum: { amount: true }
      })
    ]);

    const totalSystemLiquidity =
      (wallets._sum.walletBalance || 0) +
      (locked._sum.walletLocked || 0) +
      (escrowEntries._sum.amount || 0);

    return res.json({
      walletsTotal: wallets._sum.walletBalance || 0,
      lockedTotal: locked._sum.walletLocked || 0,
      escrowTotal: escrowEntries._sum.amount || 0,
      platformRevenue: platformRevenue._sum.amount || 0,
      totalSystemLiquidity,
      checkTimestamp: new Date()
    });
  } catch (error: any) {
    console.error('Audit Error:', error);
    return res.status(500).json({ error: 'Audit failed' });
  }
});

export default router;
