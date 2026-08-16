import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { extractText } from '../documents/text-extraction.util';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlanGuardService } from '../common/plan-guard.service';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

@Injectable()
export class PersonalTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly auditLog: AuditLogService,
    private readonly planGuard: PlanGuardService,
  ) {}

  async listForUser(userId: string) {
    return this.prisma.personalTemplate.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, sourceFileName: true, fields: true, createdAt: true },
    });
  }

  async getOne(userId: string, id: string) {
    const template = await this.prisma.personalTemplate.findFirst({ where: { id, userId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async upload(userId: string, file: Express.Multer.File, name?: string) {
    await this.planGuard.requirePaidPlan(userId, 'Personal templates', 'templatesTrialUntil');

    try {
      let text: string;
      if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
        const result = await this.ai.analyzeDocumentFromImage(file.path, file.mimetype, 'en');
        text = result.extractedText;
      } else {
        text = await extractText(file.path, file.mimetype);
      }

      if (!text.trim()) {
        throw new BadRequestException(
          "We couldn't find any readable text in this document. Try a clearer scan, or upload it as a photo instead.",
        );
      }

      const fields = await this.ai.detectPersonalTemplateFields(text);

      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      const template = await this.prisma.personalTemplate.create({
        data: {
          userId,
          name: name?.trim() || path.parse(file.originalname).name,
          sourceFileName: file.originalname,
          extractedText: text,
          fields,
        },
        select: { id: true, name: true, sourceFileName: true, fields: true, createdAt: true },
      });

      this.auditLog.record({
        actorType: 'USER',
        actorId: userId,
        actorLabel: user?.name || user?.email || user?.phone || userId,
        action: 'CREATE_PERSONAL_TEMPLATE',
        targetType: 'PersonalTemplate',
        targetId: template.id,
        metadata: { name: template.name, fieldCount: fields.length },
      });

      return template;
    } finally {
      fs.unlink(file.path, () => {});
    }
  }

  async generate(userId: string, id: string, fieldValues: Record<string, string>) {
    const template = await this.getOne(userId, id);
    const content = await this.ai.fillPersonalTemplate(template.extractedText, fieldValues);

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: userId,
      action: 'GENERATE_FROM_PERSONAL_TEMPLATE',
      targetType: 'PersonalTemplate',
      targetId: id,
      metadata: { fieldsChanged: Object.keys(fieldValues) },
    });

    return { content };
  }

  async remove(userId: string, id: string) {
    const template = await this.prisma.personalTemplate.findFirst({ where: { id, userId } });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    await this.prisma.personalTemplate.delete({ where: { id } });
    return { success: true as const };
  }
}
