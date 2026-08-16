const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'legallens_admin_token';
const IDENTITY_KEY = 'legallens_admin_identity';

export interface AdminIdentity {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function getIdentity(): AdminIdentity | null {
  const raw = localStorage.getItem(IDENTITY_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setIdentity(identity: AdminIdentity) {
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IDENTITY_KEY);
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    if (res.status === 401) clearToken();
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message || `Request failed (${res.status})`);
  }

  return res.json();
}

function toQuery(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') usp.set(key, String(value));
  });
  const qs = usp.toString();
  return qs ? `?${qs}` : '';
}

export interface LoginResponse {
  accessToken: string;
  user: AdminIdentity;
}

export function login(email: string, password: string) {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function requestOtp(phone: string) {
  return request<{ message: string }>('/auth/otp/request', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone: string, code: string) {
  return request<LoginResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AdminUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
  _count: { documents: number };
}

export function fetchUsers(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminUser>>(`/admin/users${toQuery(params)}`);
}

export function toggleAdmin(userId: string) {
  return request<{ id: string; isAdmin: boolean }>(`/admin/users/${userId}/toggle-admin`, {
    method: 'PATCH',
  });
}

export function toggleBan(userId: string, reason?: string) {
  return request<{ id: string; isBanned: boolean }>(`/admin/users/${userId}/toggle-ban`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  });
}

export function deleteUser(userId: string) {
  return request<{ success: true }>(`/admin/users/${userId}`, { method: 'DELETE' });
}

export interface AdminSubscription {
  id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  trialDocumentLimit: number | null;
  compareTrialUntil: string | null;
  templatesTrialUntil: string | null;
  exportTrialUntil: string | null;
  chatTrialUntil: string | null;
  createdAt: string;
  _count: { documents: number };
}

export function fetchSubscriptions(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminSubscription>>(`/admin/subscriptions${toQuery(params)}`);
}

// trialDocumentLimit: null clears the override, -1 grants unlimited, N sets an exact cap
export function setTrialLimit(userId: string, trialDocumentLimit: number | null) {
  return request<{ id: string; trialDocumentLimit: number | null }>(`/admin/users/${userId}/trial`, {
    method: 'PATCH',
    body: JSON.stringify({ trialDocumentLimit }),
  });
}

export type FeatureTrialKey = 'COMPARE' | 'TEMPLATES' | 'EXPORT' | 'CHAT';

// days: null clears the trial, N grants access for N days from now
export function setFeatureTrial(userId: string, feature: FeatureTrialKey, days: number | null) {
  return request<{
    id: string;
    compareTrialUntil: string | null;
    templatesTrialUntil: string | null;
    exportTrialUntil: string | null;
    chatTrialUntil: string | null;
  }>(`/admin/users/${userId}/feature-trial`, {
    method: 'PATCH',
    body: JSON.stringify({ feature, days }),
  });
}

export interface AdminDocument {
  id: string;
  fileName: string;
  fileType: string;
  status: 'UPLOADED' | 'PROCESSING' | 'READY' | 'FAILED';
  documentType: string | null;
  language: string;
  createdAt: string;
  user: { id: string; email: string | null; phone: string | null; name: string | null };
}

export function fetchDocuments(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminDocument>>(`/admin/documents${toQuery(params)}`);
}

export interface AdminPayment {
  id: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  amount: number;
  currency: string;
  status: 'CREATED' | 'PAID' | 'FAILED';
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  createdAt: string;
  user: { id: string; email: string | null; phone: string | null; name: string | null };
}

export function fetchPayments(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminPayment> & { totalRevenue: number }>(`/admin/payments${toQuery(params)}`);
}

export interface AdminReview {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { id: string; email: string | null; phone: string | null; name: string | null };
}

export function fetchReviews(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminReview> & { averageRating: number }>(`/admin/reviews${toQuery(params)}`);
}

export interface AdminAuditLogEntry {
  id: string;
  actorType: 'ADMIN' | 'USER' | 'SYSTEM';
  actorId: string | null;
  actorLabel: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export function fetchAuditLog(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminAuditLogEntry>>(`/admin/audit-log${toQuery(params)}`);
}

export interface AdminOtpLogEntry {
  id: string;
  phone: string;
  action: 'REQUESTED' | 'VERIFIED';
  success: boolean;
  createdAt: string;
}

export function fetchOtpLog(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminOtpLogEntry>>(`/admin/otp-log${toQuery(params)}`);
}

export interface AdminErrorLog {
  id: string;
  message: string;
  stack: string | null;
  path: string | null;
  method: string | null;
  statusCode: number | null;
  createdAt: string;
}

export function fetchExceptions(params: { page?: number; pageSize?: number; search?: string } = {}) {
  return request<Paginated<AdminErrorLog>>(`/admin/exceptions${toQuery(params)}`);
}

export interface AdminStats {
  totalUsers: number;
  totalDocuments: number;
  failedDocuments: number;
  payingUsers: number;
  planCounts: Record<string, number>;
  totalRevenue: number;
  averageRating: number;
  reviewCount: number;
  recentUsers: Array<{
    id: string;
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    createdAt: string;
  }>;
}

export function fetchStats() {
  return request<AdminStats>('/admin/stats');
}

export { ApiError };
