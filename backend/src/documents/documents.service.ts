import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { DocumentAnalysis } from '../ai/ai.types';
import { extractText } from './text-extraction.util';
import { AuditLogService } from '../audit-log/audit-log.service';
import { PlanGuardService } from '../common/plan-guard.service';

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
    private readonly planGuard: PlanGuardService,
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

    let consumedCredit = false;
    if (existingCount >= limit) {
      if (user.documentCredits > 0) {
        consumedCredit = true;
      } else {
        throw new ForbiddenException(
          `Your ${user.plan} plan allows ${limit} document${limit === 1 ? '' : 's'}. Upgrade to upload more, or buy document credits.`,
        );
      }
    }

    if (consumedCredit) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { documentCredits: { decrement: 1 } },
      });
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
        if (!text.trim()) {
          throw new BadRequestException(
            "We couldn't find any readable text in this document. Try a clearer scan, or upload it as a photo instead.",
          );
        }
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
      if (consumedCredit) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { documentCredits: { increment: 1 } },
        });
      }
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

  async compareDocuments(
    userId: string,
    documentIdA: string,
    documentIdB: string,
    language?: string,
  ) {
    await this.planGuard.requirePaidPlan(userId, 'Comparing documents');

    if (!documentIdA || !documentIdB || documentIdA === documentIdB) {
      throw new BadRequestException('Select two different documents to compare.');
    }
    const [docA, docB] = await Promise.all([
      this.prisma.document.findFirst({ where: { id: documentIdA, userId } }),
      this.prisma.document.findFirst({ where: { id: documentIdB, userId } }),
    ]);
    if (!docA || !docB) {
      throw new NotFoundException('One or both documents were not found.');
    }
    if (!docA.extractedText || !docB.extractedText) {
      throw new BadRequestException('Both documents must be fully analyzed before comparing.');
    }

    const result = await this.ai.compareDocuments(
      { name: docA.fileName, text: docA.extractedText },
      { name: docB.fileName, text: docB.extractedText },
      language,
    );

    return {
      documentA: { id: docA.id, fileName: docA.fileName },
      documentB: { id: docB.id, fileName: docB.fileName },
      ...result,
    };
  }

  async getKeyDates(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({ where: { id: documentId, userId } });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (!document.extractedText) {
      return { keyDates: [] };
    }
    const keyDates = await this.ai.extractKeyDates(document.extractedText, document.language ?? undefined);
    return { keyDates };
  }
}
