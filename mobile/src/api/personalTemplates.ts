import { apiClient } from './client';
import { PersonalTemplateSummary } from './types';
import { PickedFile } from './documents';

export async function listPersonalTemplates(): Promise<PersonalTemplateSummary[]> {
  const { data } = await apiClient.get<PersonalTemplateSummary[]>('/personal-templates');
  return data;
}

export async function getPersonalTemplate(
  id: string,
): Promise<PersonalTemplateSummary & { extractedText: string }> {
  const { data } = await apiClient.get<PersonalTemplateSummary & { extractedText: string }>(
    `/personal-templates/${id}`,
  );
  return data;
}

export async function uploadPersonalTemplate(
  file: PickedFile,
  name?: string,
): Promise<PersonalTemplateSummary> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  if (name) form.append('name', name);

  const { data } = await apiClient.post<PersonalTemplateSummary>(
    '/personal-templates/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}

export async function generateFromPersonalTemplate(
  id: string,
  fieldValues: Record<string, string>,
): Promise<{ content: string }> {
  const { data } = await apiClient.post<{ content: string }>(`/personal-templates/${id}/generate`, {
    fieldValues,
  });
  return data;
}

export async function deletePersonalTemplate(id: string): Promise<void> {
  await apiClient.delete(`/personal-templates/${id}`);
}
