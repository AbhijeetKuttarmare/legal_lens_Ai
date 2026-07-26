import { apiClient } from './client';
import { AuthResponse } from './types';

export async function requestOtp(phone: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>('/auth/otp/request', {
    phone,
  });
  return data;
}

export async function verifyOtp(phone: string, code: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/otp/verify', {
    phone,
    code,
  });
  return data;
}
