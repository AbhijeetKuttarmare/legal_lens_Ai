import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DocumentAnalysis } from '../ai/ai.types';
import { extractText } from './text-extraction.util';
import { AuditLogService } from '../audit-log/audit-log.service';

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png'];

const PLAN_DOCUMENT_LIMITS: Record<string, number> = {
  FREE: 1,
  PRO: Infinity,
  ENTERPRISE: Infinity,
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listForUser(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { summary: true, riskAnalysis: true },
    });
  }

  async getFullReport(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      include: { summary: true, clauseAnalysis: true, riskAnalysis: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }

  async uploadAndAnalyze(
    userId: string,
    file: Express.Multer.File,
    language = 'en',
  ) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const limit =
      user.trialDocumentLimit === -1
        ? Infinity
        : (user.trialDocumentLimit ?? PLAN_DOCUMENT_LIMITS[user.plan] ?? 1);
    const existingCount = await this.prisma.document.count({
      where: { userId, status: { not: 'FAILED' } },
    });
    if (existingCount >= limit) {
      throw new ForbiddenException(
        `Your ${user.plan} plan allows ${limit} document${limit === 1 ? '' : 's'}. Upgrade to upload more.`,
      );
    }

    const document = await this.prisma.document.create({
      data: {
        userId,
        fileName: file.originalname,
        fileType: file.mimetype,
        storagePath: file.path,
        status: 'PROCESSING',
        language,
      },
    });

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: user.name || user.email || user.phone || userId,
      action: 'CREATE_DOCUMENT',
      targetType: 'Document',
      targetId: document.id,
      metadata: { fileName: file.originalname },
    });

    try {
      let text: string;
      let analysis: DocumentAnalysis;
      if (IMAGE_MIME_TYPES.includes(file.mimetype)) {
        const result = await this.ai.analyzeDocumentFromImage(file.path, file.mimetype, language);
        analysis = result.analysis;
        text = result.extractedText;
      } else {
        text = await extractText(file.path, file.mimetype);
        analysis = await this.ai.analyzeDocument(text, language);
      }

      await this.prisma.$transaction([
        this.prisma.document.update({
          where: { id: document.id },
          data: {
            status: 'READY',
            documentType: analysis.documentType as any,
            extractedText: text,
          },
        }),
        this.prisma.summary.create({
          data: {
            documentId: document.id,
            documentType: analysis.documentType,
            summaryText: analysis.summary,
          },
        }),
        this.prisma.clauseAnalysis.create({
          data: {
            documentId: document.id,
            clauses: analysis.clauses as any,
          },
        }),
        this.prisma.riskAnalysis.create({
          data: {
            documentId: document.id,
            score: analysis.riskScore,
            level: analysis.riskLevel,
            flags: analysis.riskFlags as any,
            suggestions: analysis.suggestions as any,
          },
        }),
      ]);
    } catch (err) {
      await this.prisma.document.update({
        where: { id: document.id },
        data: { status: 'FAILED' },
      });
      fs.unlink(file.path, () => {});
      throw err;
    }

    // The original file is never read again after analysis — its text and
    // structured output are already durably stored above. Deleting it now
    // avoids relying on Render's ephemeral disk to hold onto anything.
    fs.unlink(file.path, () => {});

    return this.getFullReport(userId, document.id);
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
      include: { user: true },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    await this.prisma.document.delete({ where: { id: documentId } });
    fs.unlink(document.storagePath, () => {});

    this.auditLog.record({
      actorType: 'USER',
      actorId: userId,
      actorLabel: document.user.name || document.user.email || document.user.phone || userId,
      action: 'DELETE_DOCUMENT',
      targetType: 'Document',
      targetId: documentId,
      metadata: { fileName: document.fileName },
    });

    return { success: true };
  }
}
