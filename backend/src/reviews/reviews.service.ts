import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async create(userId: string, dto: CreateReviewDto) {
    const [user, review] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.review.create({
        data: { userId, rating: dto.rating, comment: dto.comment },
      }),
    ]);

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user?.name || user?.email || user?.phone || userId,
      action: 'CREATE_REVIEW',
      targetType: 'Review',
      targetId: review.id,
      metadata: { rating: dto.rating },
    });

    return review;
  }
}
