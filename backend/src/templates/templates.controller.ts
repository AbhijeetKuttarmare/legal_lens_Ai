import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
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
    @CurrentUser() user: { userId: string },
    @Body('templateType') templateType: string,
    @Body('fields') fields: Record<string, string>,
    @Body('consentAccepted') consentAccepted: boolean,
    @Body('language') language?: string,
  ) {
    return this.templatesService.generate(user.userId, templateType, fields, consentAccepted, language);
  }
}
