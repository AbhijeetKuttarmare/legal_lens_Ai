import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';

@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Get('types')
  listTypes() {
    return this.templatesService.listTypes();
  }

  @Post('generate')
  generate(
    @Body('templateType') templateType: string,
    @Body('fields') fields: Record<string, string>,
    @Body('language') language?: string,
  ) {
    return this.templatesService.generate(templateType, fields, language);
  }
}
