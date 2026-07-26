import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async getHistory(userId: string, documentId: string) {
    await this.assertOwnership(userId, documentId);
    return this.prisma.chatMessage.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async ask(userId: string, documentId: string, question: string) {
    const document = await this.assertOwnership(userId, documentId);

    const priorMessages = await this.prisma.chatMessage.findMany({
      where: { documentId },
      orderBy: { createdAt: 'asc' },
      take: 20,
    });

    const answer = await this.ai.chatAboutDocument(
      document.extractedText || '',
      priorMessages.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      question,
    );

    await this.prisma.chatMessage.createMany({
      data: [
        { documentId, role: 'user', content: question },
        { documentId, role: 'assistant', content: answer },
      ],
    });

    return { answer };
  }

  private async assertOwnership(userId: string, documentId: string) {
    const document = await this.prisma.document.findFirst({
      where: { id: documentId, userId },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    return document;
  }
}
