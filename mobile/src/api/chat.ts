import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, TOKEN_KEY } from './client';
import { ChatMessage } from './types';
import { API_BASE_URL } from '../config/env';

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

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
}

const USAGE_MARKER = ' USAGE ';

// React Native's fetch doesn't reliably expose a streaming response.body
// reader, so this uses XMLHttpRequest's onprogress + responseText instead —
// the standard workaround for incremental "typing" responses in RN. Same
// wire protocol as web's streamAskQuestion (admin/src/consumer/api.ts):
// plain chunked text, with a trailing " USAGE {json}" marker.
export function streamAskQuestion(
  documentId: string,
  question: string,
  onText: (chunk: string) => void,
): Promise<ChatUsage | null> {
  return new Promise((resolve, reject) => {
    AsyncStorage.getItem(TOKEN_KEY).then((token) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/documents/${documentId}/chat`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let consumedLength = 0;
      let buffer = '';
      let usage: ChatUsage | null = null;

      xhr.onprogress = () => {
        const full = xhr.responseText;
        buffer += full.slice(consumedLength);
        consumedLength = full.length;

        const markerIndex = buffer.indexOf(USAGE_MARKER);
        if (markerIndex !== -1) {
          if (markerIndex > 0) onText(buffer.slice(0, markerIndex));
          try {
            usage = JSON.parse(buffer.slice(markerIndex + USAGE_MARKER.length));
          } catch {
            // malformed usage payload — not fatal, just skip showing token counts
          }
          buffer = '';
          return;
        }

        // Hold back a tail as long as the marker in case it's split across chunks
        const safeLength = Math.max(0, buffer.length - USAGE_MARKER.length);
        if (safeLength > 0) {
          onText(buffer.slice(0, safeLength));
          buffer = buffer.slice(safeLength);
        }
      };

      xhr.onload = () => {
        if (xhr.status < 200 || xhr.status >= 300) {
          let message = `Request failed (${xhr.status})`;
          try {
            const body = JSON.parse(xhr.responseText);
            if (body?.message) message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
          } catch {
            // non-JSON error body — keep the generic message
          }
          reject(new Error(message));
          return;
        }
        if (buffer && !usage) onText(buffer);
        resolve(usage);
      };

      xhr.onerror = () => reject(new Error('Network error'));
      xhr.send(JSON.stringify({ question }));
    });
  });
}
