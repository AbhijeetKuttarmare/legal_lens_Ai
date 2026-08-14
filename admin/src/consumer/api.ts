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

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
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
    if (res.status === 401) clearSession();
    const body = await res.json().catch(() => ({}));
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
}

export function updateProfile(payload: UpdateProfilePayload) {
  return request<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
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

export function askQuestion(documentId: string, question: string) {
  return request<{ answer: string }>(`/documents/${documentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}
