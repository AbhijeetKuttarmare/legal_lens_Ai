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
import { PersonalTemplatesService } from './personal-templates.service';
import { buildMulterOptions } from '../documents/multer.config';
import { FillPersonalTemplateDto } from './dto/fill-personal-template.dto';

@UseGuards(JwtAuthGuard)
@Controller('personal-templates')
export class PersonalTemplatesController {
  constructor(private readonly personalTemplatesService: PersonalTemplatesService) {}

  @Get()
  list(@CurrentUser() user: { userId: string }) {
    return this.personalTemplatesService.listForUser(user.userId);
  }

  @Get(':id')
  getOne(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.personalTemplatesService.getOne(user.userId, id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', buildMulterOptions()))
  upload(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: Express.Multer.File,
    @Body('name') name?: string,
  ) {
    return this.personalTemplatesService.upload(user.userId, file, name);
  }

  @Post(':id/generate')
  generate(
    @CurrentUser() user: { userId: string },
    @Param('id') id: string,
    @Body() dto: FillPersonalTemplateDto,
  ) {
    return this.personalTemplatesService.generate(user.userId, id, dto.fieldValues);
  }

  @Delete(':id')
  remove(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.personalTemplatesService.remove(user.userId, id);
  }
}
