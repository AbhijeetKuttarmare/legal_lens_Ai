import { apiClient } from './client';
import { AuthUser } from './types';

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const { data } = await apiClient.patch<AuthUser>('/users/me', payload);
  return data;
}

export async function deleteAccount(): Promise<void> {
  await apiClient.delete('/users/me');
}
