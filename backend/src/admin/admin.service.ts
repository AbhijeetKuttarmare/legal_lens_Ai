import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

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
  constructor(private readonly prisma: PrismaService) {}

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
            { adminLabel: { contains: search, mode: 'insensitive' } },
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

    await this.prisma.auditLog.create({
      data: {
        adminId: adminUserId,
        adminLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
        action: updated.isAdmin ? 'GRANT_ADMIN' : 'REVOKE_ADMIN',
        targetType: 'User',
        targetId: targetUserId,
        metadata: { targetLabel: updated.name || updated.email || updated.phone },
      },
    });

    return updated;
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
          trialDocumentLimit: true,
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

    await this.prisma.auditLog.create({
      data: {
        adminId: adminUserId,
        adminLabel: admin?.name || admin?.email || admin?.phone || adminUserId,
        action,
        targetType: 'User',
        targetId: targetUserId,
        metadata: {
          targetLabel: updated.name || updated.email || updated.phone,
          trialDocumentLimit: normalized,
        },
      },
    });

    return updated;
  }
}
