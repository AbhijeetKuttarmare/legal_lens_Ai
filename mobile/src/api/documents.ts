import { apiClient } from './client';
import { ComparisonResult, DocumentReport, DocumentSummary, KeyDate } from './types';

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

export async function compareDocuments(
  documentIdA: string,
  documentIdB: string,
  language = 'en',
): Promise<ComparisonResult> {
  const { data } = await apiClient.post<ComparisonResult>('/documents/compare', {
    documentIdA,
    documentIdB,
    language,
  });
  return data;
}

export async function getKeyDates(documentId: string): Promise<KeyDate[]> {
  const { data } = await apiClient.get<{ keyDates: KeyDate[] }>(`/documents/${documentId}/key-dates`);
  return data.keyDates;
}

// Isolated one-off suggestion for a single risk flag — doesn't touch the
// document's chat history or count against the Free plan's message limit.
export async function suggestFix(
  documentId: string,
  flagTitle: string,
  flagDetail: string,
): Promise<{ suggestion: string }> {
  const { data } = await apiClient.post<{ suggestion: string }>(`/documents/${documentId}/suggest-fix`, {
    flagTitle,
    flagDetail,
  });
  return data;
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
