import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { PlanGuardService } from '../common/plan-guard.service';

const FREE_CHAT_MESSAGE_LIMIT = 5;

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly planGuard: PlanGuardService,
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

    const hasPaidAccess = await this.planGuard.hasPaidAccess(userId, 'chatTrialUntil');
    if (!hasPaidAccess) {
      const messageCount = await this.prisma.chatMessage.count({
        where: { documentId, role: 'user' },
      });
      if (messageCount >= FREE_CHAT_MESSAGE_LIMIT) {
        throw new ForbiddenException(
          `Free plan allows ${FREE_CHAT_MESSAGE_LIMIT} questions per document. Upgrade to Pro for unlimited chat.`,
        );
      }
    }

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
      document.language,
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
