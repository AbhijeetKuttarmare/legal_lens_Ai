import { Injectable } from '@nestjs/common';
import { AiService, TEMPLATE_TYPES } from '../ai/ai.service';

@Injectable()
export class TemplatesService {
  constructor(private readonly ai: AiService) {}

  listTypes() {
    return Object.entries(TEMPLATE_TYPES).map(([key, label]) => ({ key, label }));
  }

  async generate(templateType: string, fields: Record<string, string>, language?: string) {
    const content = await this.ai.generateTemplate(templateType, fields ?? {}, language);
    return { templateType, content };
  }
}
