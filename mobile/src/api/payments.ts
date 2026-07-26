import { apiClient } from './client';
import { AuthUser } from './types';

export type PayablePlan = 'PRO' | 'ENTERPRISE';

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

export async function createOrder(plan: PayablePlan): Promise<RazorpayOrder> {
  const { data } = await apiClient.post<RazorpayOrder>('/payments/create-order', { plan });
  return data;
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  plan: PayablePlan;
}

export async function verifyPayment(payload: VerifyPaymentPayload): Promise<AuthUser> {
  const { data } = await apiClient.post<AuthUser>('/payments/verify', payload);
  return data;
}
