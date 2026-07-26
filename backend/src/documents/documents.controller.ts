import {
  Controller,
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
  ) {
    return this.documentsService.uploadAndAnalyze(user.userId, file);
  }
}
