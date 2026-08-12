import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { DocumentsService } from './documents.service';
import { buildMulterOptions } from './multer.config';

@UseGuards(JwtAuthGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.documentsService.listForUser(user.userId);
  }

  @Get(':id')
  getOne(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.documentsService.getFullReport(user.userId, id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', buildMulterOptions()))
  upload(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body('language') language?: string,
  ) {
    return this.documentsService.uploadAndAnalyze(user.userId, file, language);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.documentsService.deleteDocument(user.userId, id);
  }

  @Post('compare')
  compare(
    @CurrentUser() user: { userId: string },
    @Body('documentIdA') documentIdA: string,
    @Body('documentIdB') documentIdB: string,
    @Body('language') language?: string,
  ) {
    return this.documentsService.compareDocuments(user.userId, documentIdA, documentIdB, language);
  }

  @Get(':id/key-dates')
  keyDates(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
  ) {
    return this.documentsService.getKeyDates(user.userId, id);
  }
}
