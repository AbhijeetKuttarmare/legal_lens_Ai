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

export interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
}

export async function uploadDocument(file: PickedFile): Promise<DocumentReport> {
  const form = new FormData();
  form.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.mimeType,
  } as unknown as Blob);

  const { data } = await apiClient.post<DocumentReport>(
    '/documents/upload',
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  return data;
}
