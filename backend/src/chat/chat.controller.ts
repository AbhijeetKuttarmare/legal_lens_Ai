import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChatService } from './chat.service';
import { AskDto } from './dto/ask.dto';

@UseGuards(JwtAuthGuard)
@Controller('documents/:documentId/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  history(
    @CurrentUser() user: { userId: string },
    @Param('documentId') documentId: string,
  ) {
    return this.chatService.getHistory(user.userId, documentId);
  }

  @Post()
  ask(
    @CurrentUser() user: { userId: string },
    @Param('documentId') documentId: string,
    @Body() dto: AskDto,
    @Res() res: Response,
  ) {
    return this.chatService.askStream(user.userId, documentId, dto.question, res);
  }
}
