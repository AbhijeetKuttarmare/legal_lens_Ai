import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { CreateCreditOrderDto } from './dto/create-credit-order.dto';
import { VerifyCreditOrderDto } from './dto/verify-credit-order.dto';
import { toSafeUser } from '../users/user.presenter';
import { AuditLogService } from '../audit-log/audit-log.service';
import { OrganizationsService } from '../organizations/organizations.service';

// Amounts in paise, matching the prices shown on the Subscription screen.
// PlanTier enum values stay PRO/ENTERPRISE internally (avoids a data
// migration); the UI displays them as "Pro" and "Max".
const PLAN_AMOUNTS: Record<string, number> = {
  PRO: 200000,
  ENTERPRISE: 1199900,
};

// One-time document credit packs, for FREE-plan users who don't want a
// subscription but need to analyze more than their plan's document limit.
const CREDIT_PACKS: Record<string, { credits: number; amount: number }> = {
  PACK_5: { credits: 5, amount: 24900 },
  PACK_10: { credits: 10, amount: 44900 },
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private client: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly organizations: OrganizationsService,
  ) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      this.logger.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — all payment endpoints will fail.');
    }
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    try {
      const requester = await this.prisma.user.findUnique({ where: { id: userId } });
      const amount = PLAN_AMOUNTS[dto.plan];

      const order = await this.client.orders.create({
        amount,
        currency: 'INR',
        // Razorpay caps receipt at 56 chars; a full plan name + UUID + timestamp
        // can exceed that (e.g. "ENTERPRISE_<uuid>_<ts>"), so keep it short.
        receipt: `${dto.plan}_${Date.now()}`,
        notes: { userId, plan: dto.plan },
      });

      await this.prisma.payment.create({
        data: {
          userId,
          plan: dto.plan,
          amount,
          currency: 'INR',
          razorpayOrderId: order.id,
        },
      });

      this.auditLog.record({
        actorType: 'USER',
        actorId: userId,
        actorLabel: requester?.name || requester?.email || requester?.phone || userId,
        action: 'CREATE_PAYMENT_ORDER',
        targetType: 'Payment',
        targetId: order.id,
        metadata: { plan: dto.plan, amount },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (err) {
      this.logger.error(`createOrder failed: ${(err as Error).message}`, (err as Error).stack);
      throw new BadRequestException(`Could not start checkout: ${(err as Error).message}`);
    }
  }

  async createCreditOrder(userId: string, dto: CreateCreditOrderDto) {
    try {
      const requester = await this.prisma.user.findUnique({ where: { id: userId } });
      const pack = CREDIT_PACKS[dto.pack];

      const order = await this.client.orders.create({
        amount: pack.amount,
        currency: 'INR',
        receipt: `${dto.pack}_${Date.now()}`,
        notes: { userId, creditPack: dto.pack },
      });

      await this.prisma.creditOrder.create({
        data: {
          userId,
          credits: pack.credits,
          amount: pack.amount,
          currency: 'INR',
          razorpayOrderId: order.id,
        },
      });

      this.auditLog.record({
        actorType: 'USER',
        actorId: userId,
        actorLabel: requester?.name || requester?.email || requester?.phone || userId,
        action: 'CREATE_CREDIT_ORDER',
        targetType: 'CreditOrder',
        targetId: order.id,
        metadata: { pack: dto.pack, credits: pack.credits, amount: pack.amount },
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
      };
    } catch (err) {
      this.logger.error(`createCreditOrder failed: ${(err as Error).message}`, (err as Error).stack);
      throw new BadRequestException(`Could not start checkout: ${(err as Error).message}`);
    }
  }

  async verifyCreditOrder(userId: string, dto: VerifyCreditOrderDto) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment verification failed');
    }

    // The signature only proves razorpayOrderId/razorpayPaymentId are a real,
    // matched pair — it says nothing about which pack was paid for. Trusting
    // dto.pack here would let a client claim a bigger pack than it paid for.
    // The order row written in createCreditOrder() is the source of truth.
    const order = await this.prisma.creditOrder.findUnique({ where: { razorpayOrderId: dto.razorpayOrderId } });
    if (!order || order.userId !== userId) {
      throw new BadRequestException('Payment verification failed');
    }

    // Atomically claim the order so a replayed/duplicate verify call (same
    // valid signature) can't grant the credits twice.
    const claimed = await this.prisma.creditOrder.updateMany({
      where: { razorpayOrderId: dto.razorpayOrderId, status: 'CREATED' },
      data: { status: 'PAID', razorpayPaymentId: dto.razorpayPaymentId },
    });
    if (claimed.count === 0) {
      throw new BadRequestException('Payment already verified');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { documentCredits: { increment: order.credits } },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user.name || user.email || user.phone || userId,
      action: 'CREDIT_ORDER_VERIFIED',
      targetType: 'CreditOrder',
      targetId: dto.razorpayOrderId,
      metadata: { credits: order.credits },
    });

    return toSafeUser(user);
  }

  // Server-side safety net: Razorpay calls this directly once a payment is
  // captured, so the plan still upgrades even if the mobile app never
  // reaches /payments/verify (crash, closed app, lost network, etc).
  async handleWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString('utf8'));

    if (typeof event?.event === 'string' && event.event.startsWith('subscription.')) {
      await this.organizations.handleSubscriptionWebhookEvent(event);
      return { received: true };
    }

    const payment = event?.payload?.payment?.entity;

    if (event?.event === 'payment.captured' && payment?.notes?.userId && payment?.notes?.plan) {
      await this.prisma.user.update({
        where: { id: payment.notes.userId },
        data: { plan: payment.notes.plan, planExpiresAt: null },
      });

      if (payment.order_id) {
        await this.prisma.payment
          .update({
            where: { razorpayOrderId: payment.order_id },
            data: { status: 'PAID', razorpayPaymentId: payment.id },
          })
          .catch(() => undefined); // order row may predate this tracking table
      }

      this.auditLog.record({
        actorType: 'SYSTEM',
        actorId: payment.notes.userId,
        actorLabel: 'Razorpay webhook',
        action: 'PAYMENT_CAPTURED_WEBHOOK',
        targetType: 'Payment',
        targetId: payment.order_id ?? payment.id,
        metadata: { plan: payment.notes.plan },
      });
    } else if (event?.event === 'payment.captured' && payment?.notes?.userId && payment?.notes?.creditPack) {
      const pack = CREDIT_PACKS[payment.notes.creditPack];
      if (pack) {
        await this.prisma.user.update({
          where: { id: payment.notes.userId },
          data: { documentCredits: { increment: pack.credits } },
        });

        if (payment.order_id) {
          await this.prisma.creditOrder
            .update({
              where: { razorpayOrderId: payment.order_id },
              data: { status: 'PAID', razorpayPaymentId: payment.id },
            })
            .catch(() => undefined);
        }

        this.auditLog.record({
          actorType: 'SYSTEM',
          actorId: payment.notes.userId,
          actorLabel: 'Razorpay webhook',
          action: 'CREDIT_ORDER_CAPTURED_WEBHOOK',
          targetType: 'CreditOrder',
          targetId: payment.order_id ?? payment.id,
          metadata: { pack: payment.notes.creditPack, credits: pack.credits },
        });
      }
    }

    return { received: true };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment verification failed');
    }

    // The signature only proves razorpayOrderId/razorpayPaymentId are a real,
    // matched pair — it says nothing about which plan was paid for. Trusting
    // dto.plan here would let a client claim a higher plan than it paid for.
    // The order row written in createOrder() is the source of truth.
    const order = await this.prisma.payment.findUnique({ where: { razorpayOrderId: dto.razorpayOrderId } });
    if (!order || order.userId !== userId) {
      throw new BadRequestException('Payment verification failed');
    }

    // Atomically claim the order so a replayed/duplicate verify call (same
    // valid signature) can't re-apply it.
    const claimed = await this.prisma.payment.updateMany({
      where: { razorpayOrderId: dto.razorpayOrderId, status: 'CREATED' },
      data: { status: 'PAID', razorpayPaymentId: dto.razorpayPaymentId },
    });
    if (claimed.count === 0) {
      throw new BadRequestException('Payment already verified');
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      // A real payment always wins over any admin-granted temporary plan.
      data: { plan: order.plan, planExpiresAt: null },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user.name || user.email || user.phone || userId,
      action: 'PAYMENT_VERIFIED',
      targetType: 'Payment',
      targetId: dto.razorpayOrderId,
      metadata: { plan: order.plan },
    });

    return toSafeUser(user);
  }
}
