import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { VerifySubscriptionDto } from './dto/verify-subscription.dto';
import { AddMemberDto } from './dto/add-member.dto';

// Razorpay Plan IDs, created once via a one-off script (plans.create). Razorpay
// bills plan.amount * subscription.quantity per cycle — that's how per-seat
// pricing is implemented, rather than one plan per seat count.
const SEAT_PLAN_IDS: Record<string, string> = {
  STANDARD: 'plan_TPc288iAub9leJ',
  PREMIUM: 'plan_TPc28HyqcvANzg',
};

function label(user: { name?: string | null; email?: string | null; phone?: string | null } | null, fallback: string) {
  return user?.name || user?.email || user?.phone || fallback;
}

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  private client: Razorpay;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      this.logger.error('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set — team billing endpoints will fail.');
    }
    this.client = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrganization(ownerId: string, dto: CreateOrganizationDto) {
    const existingMembership = await this.prisma.organizationMember.findUnique({ where: { userId: ownerId } });
    if (existingMembership) {
      throw new ConflictException('You are already part of a team.');
    }

    const owner = await this.prisma.user.findUnique({ where: { id: ownerId } });
    const planId = SEAT_PLAN_IDS[dto.seatTier];

    let subscription: { id: string };
    try {
      subscription = await this.client.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity: dto.seatCount,
        // Razorpay requires a bound; 120 monthly cycles (10 years) is
        // effectively "runs until cancelled" for a monthly plan.
        total_count: 120,
        notes: { ownerId, seatTier: dto.seatTier },
      } as any);
    } catch (err) {
      this.logger.error(`createOrganization subscription failed: ${(err as Error).message}`, (err as Error).stack);
      throw new BadRequestException(`Could not start team checkout: ${(err as Error).message}`);
    }

    const org = await this.prisma.organization.create({
      data: {
        name: dto.name || `${label(owner, 'My')} Team`,
        ownerId,
        seatTier: dto.seatTier as any,
        members: {
          create: { userId: ownerId, role: 'OWNER' },
        },
        subscription: {
          create: {
            razorpaySubscriptionId: subscription.id,
            razorpayPlanId: planId,
            seatTier: dto.seatTier as any,
            seatCount: dto.seatCount,
            status: 'CREATED',
          },
        },
      },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: ownerId,
      actorLabel: label(owner, ownerId),
      action: 'CREATE_TEAM_SUBSCRIPTION',
      targetType: 'Organization',
      targetId: org.id,
      metadata: { seatTier: dto.seatTier, seatCount: dto.seatCount },
    });

    return {
      organizationId: org.id,
      razorpaySubscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  async verifySubscription(userId: string, dto: VerifySubscriptionDto) {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${dto.razorpayPaymentId}|${dto.razorpaySubscriptionId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Subscription verification failed');
    }

    const [user, sub] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.teamSubscription.update({
        where: { razorpaySubscriptionId: dto.razorpaySubscriptionId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: label(user, userId),
      action: 'TEAM_SUBSCRIPTION_VERIFIED',
      targetType: 'TeamSubscription',
      targetId: dto.razorpaySubscriptionId,
      metadata: { organizationId: sub.organizationId },
    });

    return { success: true };
  }

  async getMyOrganization(userId: string) {
    const membership = await this.prisma.organizationMember.findUnique({
      where: { userId },
      include: {
        organization: {
          include: {
            subscription: true,
            members: {
              include: { user: { select: { id: true, name: true, email: true, phone: true } } },
            },
          },
        },
      },
    });

    if (!membership) {
      return null;
    }

    const { organization } = membership;
    return {
      id: organization.id,
      name: organization.name,
      role: membership.role,
      seatTier: organization.seatTier,
      seatCount: organization.subscription?.seatCount ?? 0,
      subscriptionStatus: organization.subscription?.status ?? 'CREATED',
      members: organization.members.map((m) => ({
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        name: m.user.name,
        email: m.user.email,
        phone: m.user.phone,
      })),
    };
  }

  async addMember(ownerId: string, dto: AddMemberDto) {
    const [owner, org] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: ownerId } }),
      this.prisma.organization.findUnique({
        where: { ownerId },
        include: { members: true, subscription: true },
      }),
    ]);

    if (!org) {
      throw new NotFoundException('You do not own a team.');
    }
    if (org.subscription?.status !== 'ACTIVE') {
      throw new BadRequestException('Your team subscription is not active yet.');
    }
    if (org.members.length >= org.subscription.seatCount) {
      throw new BadRequestException('All seats are in use. Increase your seat count to add more members.');
    }

    const user = await this.prisma.user.upsert({
      where: { phone: dto.phone },
      update: {},
      create: { phone: dto.phone },
    });

    const alreadyMember = await this.prisma.organizationMember.findUnique({ where: { userId: user.id } });
    if (alreadyMember) {
      throw new ConflictException('This person is already part of a team.');
    }

    await this.prisma.organizationMember.create({
      data: { organizationId: org.id, userId: user.id, role: 'MEMBER' },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: ownerId,
      actorLabel: label(owner, ownerId),
      action: 'ADD_TEAM_MEMBER',
      targetType: 'Organization',
      targetId: org.id,
      metadata: { memberPhone: dto.phone },
    });

    return { success: true };
  }

  async removeMember(ownerId: string, targetUserId: string) {
    const [owner, org] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: ownerId } }),
      this.prisma.organization.findUnique({ where: { ownerId } }),
    ]);

    if (!org) {
      throw new NotFoundException('You do not own a team.');
    }
    if (targetUserId === ownerId) {
      throw new BadRequestException('Cannot remove the team owner. Cancel the subscription instead.');
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId: targetUserId, organizationId: org.id },
    });
    if (!membership) {
      throw new NotFoundException('That user is not a member of your team.');
    }

    await this.prisma.organizationMember.delete({ where: { id: membership.id } });

    this.auditLog.record({
      actorType: 'USER',
      actorId: ownerId,
      actorLabel: label(owner, ownerId),
      action: 'REMOVE_TEAM_MEMBER',
      targetType: 'Organization',
      targetId: org.id,
      metadata: { removedUserId: targetUserId },
    });

    return { success: true };
  }

  // Called from PaymentsService's shared Razorpay webhook handler for any
  // event whose type starts with "subscription.".
  async handleSubscriptionWebhookEvent(event: { event: string; payload?: { subscription?: { entity?: any } } }) {
    const subscriptionEntity = event?.payload?.subscription?.entity;
    if (!subscriptionEntity?.id) return;

    const existing = await this.prisma.teamSubscription.findUnique({
      where: { razorpaySubscriptionId: subscriptionEntity.id },
    });
    if (!existing) return;

    let status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | undefined;
    if (event.event === 'subscription.activated' || event.event === 'subscription.charged') {
      status = 'ACTIVE';
    } else if (event.event === 'subscription.cancelled' || event.event === 'subscription.completed') {
      status = 'CANCELLED';
    } else if (event.event === 'subscription.pending' || event.event === 'subscription.halted') {
      status = 'PAST_DUE';
    }

    if (!status) return;

    await this.prisma.teamSubscription.update({
      where: { razorpaySubscriptionId: subscriptionEntity.id },
      data: {
        status,
        currentPeriodEnd: subscriptionEntity.current_end
          ? new Date(subscriptionEntity.current_end * 1000)
          : undefined,
      },
    });

    this.auditLog.record({
      actorType: 'SYSTEM',
      actorLabel: 'Razorpay webhook',
      action: `TEAM_SUBSCRIPTION_${status}`,
      targetType: 'TeamSubscription',
      targetId: subscriptionEntity.id,
      metadata: { event: event.event },
    });
  }
}
