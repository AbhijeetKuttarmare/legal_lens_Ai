import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type AuditActorType = 'ADMIN' | 'USER' | 'SYSTEM';

interface RecordParams {
  actorType: AuditActorType;
  actorId?: string | null;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  // Swallows its own errors — a logging failure should never break the
  // primary operation (document upload, payment, etc.) it's recording.
  async record(params: RecordParams): Promise<void> {
    await this.prisma.auditLog
      .create({
        data: {
          actorType: params.actorType,
          actorId: params.actorId ?? null,
          actorLabel: params.actorLabel,
          action: params.action,
          targetType: params.targetType,
          targetId: params.targetId ?? null,
          metadata: params.metadata as never,
        },
      })
      .catch(() => undefined);
  }
}
