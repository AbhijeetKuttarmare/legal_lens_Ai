import { apiClient } from './client';
import { TemplateTypeOption } from './types';

export async function listTemplateTypes(): Promise<TemplateTypeOption[]> {
  const { data } = await apiClient.get<TemplateTypeOption[]>('/templates/types');
  return data;
}

export async function generateTemplate(
  templateType: string,
  fields: Record<string, string>,
  language = 'en',
): Promise<{ templateType: string; content: string }> {
  const { data } = await apiClient.post<{ templateType: string; content: string }>('/templates/generate', {
    templateType,
    fields,
    language,
  });
  return data;
}
