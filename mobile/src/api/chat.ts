import { apiClient } from './client';
import { ChatMessage } from './types';

export async function getChatHistory(documentId: string): Promise<ChatMessage[]> {
  const { data } = await apiClient.get<ChatMessage[]>(
    `/documents/${documentId}/chat`,
  );
  return data;
}

export async function askQuestion(
  documentId: string,
  question: string,
): Promise<{ answer: string }> {
  const { data } = await apiClient.post<{ answer: string }>(
    `/documents/${documentId}/chat`,
    { question },
  );
  return data;
}
