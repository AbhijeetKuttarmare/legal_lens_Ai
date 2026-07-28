import { apiClient } from './client';
import { DocumentReport, DocumentSummary } from './types';

export async function listDocuments(): Promise<DocumentSummary[]> {
  const { data } = await apiClient.get<DocumentSummary[]>('/documents');
  return data;
}

export async function getDocumentReport(id: string): Promise<DocumentReport> {
  const { data } = await apiClient.get<DocumentReport>(`/documents/${id}`);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await apiClient.delete(`/documents/${id}`);
}

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function uploadDocument(file: PickedFile, language = 'en'): Promise<DocumentReport> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);
  form.append('language', language);

  const { data } = await apiClient.post<DocumentReport>(
    '/documents/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
