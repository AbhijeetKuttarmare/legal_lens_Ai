import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { FeatureTrialKey } from './dto/set-feature-trial.dto';
import { PlanKey } from './dto/set-plan.dto';
import { SeatTierKey } from './dto/grant-team.dto';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

const FEATURE_TRIAL_COLUMNS: Record<FeatureTrialKey, 'compareTrialUntil' | 'templatesTrialUntil' | 'exportTrialUntil' | 'chatTrialUntil'> = {
  COMPARE: 'compareTrialUntil',
  TEMPLATES: 'templatesTrialUntil',
  EXPORT: 'exportTrialUntil',
  CHAT: 'chatTrialUntil',
};

function clampPageSize(pageSize?: number) {
  if (!pageSize || pageSize < 1) return DEFAULT_PAGE_SIZE;
  return Math.min(pageSize, MAX_PAGE_SIZE);
}

function clampPage(page?: number) {
  if (!page || page < 1) return 1;
  return page;
}

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listUsers(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          firstName: true,
          lastName: true,
          plan: true,
          isAdmin: true,
          isBanned: true,
          createdAt: true,
          _count: { select: { documents: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async listDocuments(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.DocumentWhereInput = search
      ? {
          OR: [
            { fileName: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { phone: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        select: {
          id: true,
          fileName: true,
          fileType: true,
          status: true,
          documentType: true,
          language: true,
          createdAt: true,
          user: { select: { id: true, email: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.document.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async listPayments(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.PaymentWhereInput = search
      ? {
          OR: [
            { razorpayOrderId: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { phone: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [data, total, revenue] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        select: {
          id: true,
          plan: true,
          amount: true,
          currency: true,
          status: true,
          razorpayOrderId: true,
          razorpayPaymentId: true,
          createdAt: true,
          user: { select: { id: true, email: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.payment.count({ where }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum: { amount: true },
      }),
    ]);

    return { data, total, page, pageSize, totalRevenue: revenue._sum.amount ?? 0 };
  }

  async listReviews(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.ReviewWhereInput = search
      ? {
          OR: [
            { comment: { contains: search, mode: 'insensitive' } },
            { user: { name: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } },
            { user: { phone: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {};

    const [data, total, avg] = await Promise.all([
      this.prisma.review.findMany({
        where,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: { select: { id: true, email: true, phone: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
    ]);

    return { data, total, page, pageSize, averageRating: avg._avg.rating ?? 0 };
  }

  async listAuditLog(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.AuditLogWhereInput = search
      ? {
          OR: [
            { actorLabel: { contains: search, mode: 'insensitive' } },
            { action: { contains: search, mode: 'insensitive' } },
            { targetType: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async listErrorLogs(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.ErrorLogWhereInput = search
      ? {
          OR: [
            { message: { contains: search, mode: 'insensitive' } },
            { path: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.errorLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.errorLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  async getStats() {
    const [totalUsers, totalDocuments, failedDocuments, planGroups, revenueAgg, ratingAgg, recentUsers] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.document.count(),
        this.prisma.document.count({ where: { status: 'FAILED' } }),
        this.prisma.user.groupBy({ by: ['plan'], _count: { plan: true } }),
        this.prisma.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
        this.prisma.review.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
        this.prisma.user.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: { id: true, name: true, firstName: true, lastName: true, email: true, phone: true, createdAt: true },
        }),
      ]);

    const planCounts: Record<string, number> = { FREE: 0, PRO: 0, ENTERPRISE: 0 };
    planGroups.forEach((g) => {
      planCounts[g.plan] = g._count.plan;
    });

    return {
      totalUsers,
      totalDocuments,
      failedDocuments,
      payingUsers: totalUsers - (planCounts.FREE ?? 0),
      planCounts,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      averageRating: ratingAgg._avg.rating ?? 0,
      reviewCount: ratingAgg._count.rating,
      recentUsers,
    };
  }

  async toggleAdminStatus(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot change your own admin status');
    }

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { isAdmin: !target.isAdmin },
      select: { id: true, isAdmin: true, name: true, email: true, phone: true },
    });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: updated.isAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { targetLabel: updated.name || updated.email || updated.phone },
    });

    return updated;
  }

  async toggleBanStatus(adminUserId: string, targetUserId: string, reason?: string) {
    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot ban your own account');
    }

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.isAdmin) {
      throw new BadRequestException('Cannot ban another admin — revoke their admin access first');
    }

    const willBan = !target.isBanned;
    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        isBanned: willBan,
        bannedAt: willBan ? new Date() : null,
        banReason: willBan ? reason?.trim() || null : null,
      },
      select: { id: true, isBanned: true, name: true, email: true, phone: true },
    });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: updated.isBanned ? 'BAN_USER' : 'UNBAN_USER',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { targetLabel: updated.name || updated.email || updated.phone, reason },
    });

    return updated;
  }

  async deleteUser(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new BadRequestException('Cannot delete your own account');
    }

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }
    if (target.isAdmin) {
      throw new BadRequestException('Cannot delete another admin — revoke their admin access first');
    }

    const documents = await this.prisma.document.findMany({
      where: { userId: targetUserId },
      select: { storagePath: true },
    });

    await this.prisma.user.delete({ where: { id: targetUserId } });
    for (const doc of documents) {
      fs.unlink(doc.storagePath, () => {});
    }

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: 'DELETE_USER',
      targetType: 'User',
      targetId: targetUserId,
      metadata: { targetLabel: target.name || target.email || target.phone },
    });

    return { success: true as const };
  }

  async listSubscriptions(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          name: true,
          plan: true,
          planExpiresAt: true,
          trialDocumentLimit: true,
          compareTrialUntil: true,
          templatesTrialUntil: true,
          exportTrialUntil: true,
          chatTrialUntil: true,
          createdAt: true,
          _count: { select: { documents: true } },
          ownedOrganization: {
            select: {
              id: true,
              name: true,
              seatTier: true,
              subscription: { select: { status: true, seatCount: true, razorpayPlanId: true } },
              members: { select: { id: true } },
            },
          },
          organizationMember: {
            select: { organizationId: true, role: true, organization: { select: { name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }

  // Admin-only bypass of Razorpay for demoing/testing the team plan without
  // a real charge. razorpayPlanId is set to a sentinel so it's obviously
  // distinguishable from a genuine subscription in the DB/audit log.
  async grantTestTeam(adminUserId: string, targetUserId: string, seatTier: SeatTierKey, seatCount: number) {
    const existingMembership = await this.prisma.organizationMember.findUnique({ where: { userId: targetUserId } });
    if (existingMembership) {
      throw new ConflictException('This user is already part of a team. Revoke it first.');
    }

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const org = await this.prisma.organization.create({
      data: {
        name: `${target.name || target.email || target.phone || 'Test'} Team (admin-granted)`,
        ownerId: targetUserId,
        seatTier: seatTier as any,
        members: { create: { userId: targetUserId, role: 'OWNER' } },
        subscription: {
          create: {
            razorpaySubscriptionId: `admin_grant_${crypto.randomUUID()}`,
            razorpayPlanId: 'ADMIN_GRANTED',
            seatTier: seatTier as any,
            seatCount,
            status: 'ACTIVE',
          },
        },
      },
      include: { subscription: true },
    });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: 'GRANT_TEST_TEAM',
      targetType: 'Organization',
      targetId: org.id,
      metadata: { targetUserId, seatTier, seatCount },
    });

    return org;
  }

  async revokeTestTeam(adminUserId: string, targetUserId: string) {
    const [admin, org] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.organization.findUnique({ where: { ownerId: targetUserId } }),
    ]);
    if (!org) {
      throw new NotFoundException('This user does not own a team.');
    }

    // Cascades to OrganizationMember and TeamSubscription rows (schema
    // onDelete: Cascade), fully freeing the owner and every member to be
    // re-granted or join another team.
    await this.prisma.organization.delete({ where: { id: org.id } });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: 'REVOKE_TEST_TEAM',
      targetType: 'Organization',
      targetId: org.id,
      metadata: { targetUserId, orgName: org.name },
    });

    return { success: true as const };
  }

  async setTrialLimit(adminUserId: string, targetUserId: string, trialDocumentLimit: number | null | undefined) {
    const normalized = trialDocumentLimit === undefined ? null : trialDocumentLimit;

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { trialDocumentLimit: normalized },
      select: { id: true, trialDocumentLimit: true, name: true, email: true, phone: true },
    });

    const action =
      normalized === null ? 'CLEAR_TRIAL_LIMIT' : normalized === -1 ? 'GRANT_UNLIMITED_TRIAL' : 'SET_TRIAL_LIMIT';

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action,
      targetType: 'User',
      targetId: targetUserId,
      metadata: {
        targetLabel: updated.name || updated.email || updated.phone,
        trialDocumentLimit: normalized,
      },
    });

    return updated;
  }

  async setFeatureTrial(
    adminUserId: string,
    targetUserId: string,
    feature: FeatureTrialKey,
    days: number | null | undefined,
  ) {
    const column = FEATURE_TRIAL_COLUMNS[feature];
    const normalizedDays = days === undefined ? null : days;
    const expiresAt = normalizedDays ? new Date(Date.now() + normalizedDays * 24 * 60 * 60 * 1000) : null;

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { [column]: expiresAt },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        compareTrialUntil: true,
        templatesTrialUntil: true,
        exportTrialUntil: true,
        chatTrialUntil: true,
      },
    });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: expiresAt ? 'GRANT_FEATURE_TRIAL' : 'CLEAR_FEATURE_TRIAL',
      targetType: 'User',
      targetId: targetUserId,
      metadata: {
        targetLabel: updated.name || updated.email || updated.phone,
        feature,
        days: normalizedDays,
        expiresAt,
      },
    });

    return updated;
  }

  async setPlanOverride(
    adminUserId: string,
    targetUserId: string,
    plan: PlanKey,
    days: number | null | undefined,
  ) {
    const normalizedDays = days === undefined ? null : days;
    // Free never needs an expiry; Pro/Enterprise get one only if a duration
    // was given — omitting it grants a permanent, admin-comped plan.
    const expiresAt = plan !== 'FREE' && normalizedDays ? new Date(Date.now() + normalizedDays * 24 * 60 * 60 * 1000) : null;

    const [admin, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: adminUserId } }),
      this.prisma.user.findUnique({ where: { id: targetUserId } }),
    ]);

    if (!target) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: { plan, planExpiresAt: expiresAt },
      select: { id: true, plan: true, planExpiresAt: true, name: true, email: true, phone: true },
    });

    await this.auditLog.record({
      actorType: 'ADMIN',
      actorId: adminUserId,
      actorLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
      action: 'SET_PLAN_OVERRIDE',
      targetType: 'User',
      targetId: targetUserId,
      metadata: {
        targetLabel: updated.name || updated.email || updated.phone,
        plan,
        days: normalizedDays,
        expiresAt,
      },
    });

    return updated;
  }

  async listOtpLog(params: { page?: number; pageSize?: number; search?: string }) {
    const page = clampPage(params.page);
    const pageSize = clampPageSize(params.pageSize);
    const search = params.search?.trim();

    const where: Prisma.OtpLogWhereInput = search ? { phone: { contains: search } } : {};

    const [data, total] = await Promise.all([
      this.prisma.otpLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.otpLog.count({ where }),
    ]);

    return { data, total, page, pageSize };
  }
}
