declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

export interface RazorpaySuccessResponse {
  razorpay_order_id?: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

export interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  // One-time checkout uses order_id; recurring Team plan checkout uses
  // subscription_id instead — Razorpay infers the amount from the plan.
  order_id?: string;
  subscription_id?: string;
  name: string;
  description?: string;
  prefill?: { contact?: string | null };
  theme?: { color?: string };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Could not load payment gateway. Please check your connection.'));
    document.body.appendChild(script);
  });

  return loadPromise;
}
