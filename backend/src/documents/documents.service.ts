import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { extractText } from './text-extraction.util';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
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
  ) {
    const document = await this.prisma.document.create({
      data: {
        userId,
        fileName: file.originalname,
        fileType: file.mimetype,
        storagePath: file.path,
        status: 'PROCESSING',
      },
    });

    try {
      const text = await extractText(file.path, file.mimetype);
      const analysis = await this.ai.analyzeDocument(text);

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
      throw err;
    }

    return this.getFullReport(userId, document.id);
  }
}
