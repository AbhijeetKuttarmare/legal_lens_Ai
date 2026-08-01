import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { toSafeUser } from '../users/user.presenter';

// Amounts in paise, matching the prices shown on the Subscription screen.
const PLAN_AMOUNTS: Record<string, number> = {
  PRO: 29900,
  ENTERPRISE: 59900,
};

@Injectable()
export class PaymentsService {
  private client: Razorpay;

  constructor(private readonly prisma: PrismaService) {
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
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

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
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
    const payment = event?.payload?.payment?.entity;

    if (event?.event === 'payment.captured' && payment?.notes?.userId && payment?.notes?.plan) {
      await this.prisma.user.update({
        where: { id: payment.notes.userId },
        data: { plan: payment.notes.plan },
      });

      if (payment.order_id) {
        await this.prisma.payment
          .update({
            where: { razorpayOrderId: payment.order_id },
            data: { status: 'PAID', razorpayPaymentId: payment.id },
          })
          .catch(() => undefined); // order row may predate this tracking table
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

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { plan: dto.plan },
    });

    await this.prisma.payment
      .update({
        where: { razorpayOrderId: dto.razorpayOrderId },
        data: { status: 'PAID', razorpayPaymentId: dto.razorpayPaymentId },
      })
      .catch(() => undefined); // order row may predate this tracking table

    return toSafeUser(user);
  }
}
