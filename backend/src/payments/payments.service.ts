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
      receipt: `${dto.plan}_${userId}_${Date.now()}`,
      notes: { userId, plan: dto.plan },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
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

    return toSafeUser(user);
  }
}
