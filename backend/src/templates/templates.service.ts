import { BadRequestException, Injectable } from '@nestjs/common';
import { AiService, TEMPLATE_TYPES } from '../ai/ai.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PrismaService } from '../prisma/prisma.service';
import { PlanGuardService } from '../common/plan-guard.service';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly ai: AiService,
    private readonly auditLog: AuditLogService,
    private readonly prisma: PrismaService,
    private readonly planGuard: PlanGuardService,
  ) {}

  listTypes() {
    return Object.entries(TEMPLATE_TYPES).map(([key, label]) => ({ key, label }));
  }

  async generate(
    userId: string,
    templateType: string,
    fields: Record<string, string>,
    consentAccepted: boolean,
    language?: string,
  ) {
    await this.planGuard.requirePaidPlan(userId, 'Document templates', 'templatesTrialUntil');

    if (!consentAccepted) {
      throw new BadRequestException(
        'You must confirm this is a Clauzera-generated draft, not legal advice, before generating a document.',
      );
    }

    const content = await this.ai.generateTemplate(templateType, fields ?? {}, language);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user?.name || user?.email || user?.phone || userId,
      action: 'GENERATE_TEMPLATE',
      targetType: 'Template',
      metadata: { templateType, fields },
    });

    return { templateType, content };
  }
}
