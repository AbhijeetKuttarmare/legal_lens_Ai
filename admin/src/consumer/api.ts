import type {
  AuthResponse,
  AuthUser,
  ChatMessage,
  ComparisonResult,
  CreditPack,
  DocumentReport,
  DocumentSummary,
  KeyDate,
  Organization,
  PersonalTemplateSummary,
  PayablePlan,
  RazorpayOrder,
  SeatTier,
  TemplateTypeOption,
  TeamSubscriptionOrder,
} from './types';

const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'legallens_user_token';
const USER_KEY = 'legallens_user_identity';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

const LOGOUT_REASON_KEY = 'legallens_logout_reason';

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// Read once by the login screen, then cleared — surfaces *why* a 401 kicked
// the user out (e.g. a ban) instead of silently dropping them at login.
export function takeLogoutReason(): string | null {
  const reason = localStorage.getItem(LOGOUT_REASON_KEY);
  localStorage.removeItem(LOGOUT_REASON_KEY);
  return reason;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (body.message) localStorage.setItem(LOGOUT_REASON_KEY, body.message);
      clearSession();
    }
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export function requestOtp(phone: string) {
  return request<{ message: string }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<AuthResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  occupation?: string;
}

export function updateProfile(payload: UpdateProfilePayload) {
  return request<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function getMe() {
  return request<AuthUser>('/users/me');
}

type FeatureTrialField = 'compareTrialUntil' | 'templatesTrialUntil' | 'exportTrialUntil' | 'chatTrialUntil';

function isTrialActive(iso: string | null | undefined) {
  return Boolean(iso && new Date(iso).getTime() > Date.now());
}

export function hasFeatureAccess(user: AuthUser | null, trialField: FeatureTrialField) {
  if (!user) return false;
  if (user.plan === 'PRO' || user.plan === 'ENTERPRISE') return true;
  return isTrialActive(user[trialField]);
}

export function deleteAccount() {
  return request<void>('/users/me', { method: 'DELETE' });
}

export function createOrder(plan: PayablePlan) {
  return request<RazorpayOrder>('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ plan }),
  });
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: PayablePlan;
}

export function verifyPayment(payload: VerifyPaymentPayload) {
  return request<AuthUser>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createCreditOrder(pack: CreditPack) {
  return request<RazorpayOrder>('/payments/create-credit-order', {
    method: 'POST',
    body: JSON.stringify({ pack }),
  });
}

export interface VerifyCreditOrderPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  pack: CreditPack;
}

export function verifyCreditOrder(payload: VerifyCreditOrderPayload) {
  return request<AuthUser>('/payments/verify-credit-order', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function listDocuments() {
  return request<DocumentSummary[]>('/documents');
}

export function getDocumentReport(id: string) {
  return request<DocumentReport>(`/documents/${id}`);
}

export function deleteDocument(id: string) {
  return request<void>(`/documents/${id}`, { method: 'DELETE' });
}

export function uploadDocument(file: File, language = 'en') {
  const form = new FormData();
  form.append('file', file);
  form.append('language', language);
  return request<DocumentReport>('/documents/upload', {
    method: 'POST',
    body: form,
  });
}

export function checkExportAccess() {
  return request<{ allowed: true }>('/documents/export-access', { method: 'POST' });
}

// Isolated one-off suggestion for a single risk flag — doesn't touch the
// document's chat history or count against the Free plan's message limit.
export function suggestFix(documentId: string, flagTitle: string, flagDetail: string) {
  return request<{ suggestion: string }>(`/documents/${documentId}/suggest-fix`, {
    method: 'POST',
    body: JSON.stringify({ flagTitle, flagDetail }),
  });
}

export function compareDocuments(documentIdA: string, documentIdB: string, language = 'en') {
  return request<ComparisonResult>('/documents/compare', {
    method: 'POST',
    body: JSON.stringify({ documentIdA, documentIdB, language }),
  });
}

export function getKeyDates(documentId: string) {
  return request<{ keyDates: KeyDate[] }>(`/documents/${documentId}/key-dates`);
}

export function listTemplateTypes() {
  return request<TemplateTypeOption[]>('/templates/types');
}

export function generateTemplate(
  templateType: string,
  fields: Record<string, string>,
  consentAccepted: boolean,
  language = 'en',
) {
  return request<{ templateType: string; content: string }>('/templates/generate', {
    method: 'POST',
    body: JSON.stringify({ templateType, fields, consentAccepted, language }),
  });
}

export function listPersonalTemplates() {
  return request<PersonalTemplateSummary[]>('/personal-templates');
}

export function getPersonalTemplate(id: string) {
  return request<PersonalTemplateSummary & { extractedText: string }>(`/personal-templates/${id}`);
}

export function uploadPersonalTemplate(file: File, name?: string) {
  const form = new FormData();
  form.append('file', file);
  if (name) form.append('name', name);
  return request<PersonalTemplateSummary>('/personal-templates/upload', {
    method: 'POST',
    body: form,
  });
}

export function generateFromPersonalTemplate(id: string, fieldValues: Record<string, string>) {
  return request<{ content: string }>(`/personal-templates/${id}/generate`, {
    method: 'POST',
    body: JSON.stringify({ fieldValues }),
  });
}

export function deletePersonalTemplate(id: string) {
  return request<{ success: true }>(`/personal-templates/${id}`, { method: 'DELETE' });
}

export function getMyOrganization() {
  return request<Organization | null>('/organizations/me');
}

export function createOrganization(seatTier: SeatTier, seatCount: number, name?: string) {
  return request<TeamSubscriptionOrder>('/organizations', {
    method: 'POST',
    body: JSON.stringify({ seatTier, seatCount, name }),
  });
}

export interface VerifySubscriptionPayload {
  razorpaySubscriptionId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export function verifyTeamSubscription(payload: VerifySubscriptionPayload) {
  return request<{ success: true }>('/organizations/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addTeamMember(phone: string) {
  return request<{ success: true }>('/organizations/members', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function removeTeamMember(userId: string) {
  return request<{ success: true }>(`/organizations/members/${userId}`, { method: 'DELETE' });
}

export function getChatHistory(documentId: string) {
  return request<ChatMessage[]>(`/documents/${documentId}/chat`);
}

export interface ChatUsage {
  inputTokens: number;
  outputTokens: number;
}

const USAGE_MARKER = ' USAGE ';

// Streams the answer as it's generated, calling onText for each chunk of
// visible text. Resolves with token usage once the stream ends (or null if
// the server didn't send one, e.g. an older backend).
export async function streamAskQuestion(
  documentId: string,
  question: string,
  onText: (chunk: string) => void,
): Promise<ChatUsage | null> {
  const token = getToken();
  const res = await fetch(`${API_URL}/documents/${documentId}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    if (res.status === 401) {
      if (body.message) localStorage.setItem(LOGOUT_REASON_KEY, body.message);
      clearSession();
    }
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`);
  }

  const reader = res.body?.getReader();
  if (!reader) return null;

  const decoder = new TextDecoder();
  let buffer = '';
  let usage: ChatUsage | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const markerIndex = buffer.indexOf(USAGE_MARKER);
    if (markerIndex !== -1) {
      if (markerIndex > 0) onText(buffer.slice(0, markerIndex));
      try {
        usage = JSON.parse(buffer.slice(markerIndex + USAGE_MARKER.length));
      } catch {
        // malformed usage payload — not fatal, just skip showing token counts
      }
      buffer = '';
      break;
    }

    // Hold back a tail as long as the marker in case it's split across chunks
    const safeLength = Math.max(0, buffer.length - USAGE_MARKER.length);
    if (safeLength > 0) {
      onText(buffer.slice(0, safeLength));
      buffer = buffer.slice(safeLength);
    }
  }

  if (buffer && !usage) onText(buffer);

  return usage;
}
