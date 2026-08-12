import { useState } from 'react';
import { ApiError, createOrder, getStoredUser, setStoredUser, verifyPayment } from '../api';
import type { PayablePlan } from '../types';
import { loadRazorpayScript } from '../razorpay';
import { CheckIcon } from '../../icons';

const PLANS: {
  key: 'FREE' | PayablePlan;
  name: string;
  price: string;
  period: string;
  features: string[];
}[] = [
  { key: 'FREE', name: 'Free', price: '₹0', period: '', features: ['3 documents', 'AI summary', 'Document history'] },
  {
    key: 'PRO',
    name: 'Pro',
    price: '₹299',
    period: '/month',
    features: [
      'Unlimited uploads',
      'Unlimited AI chat',
      'Risk detection',
      'Clause comparison',
      'Multi-language support',
      'Export PDF report',
      'Priority support',
    ],
  },
  { key: 'ENTERPRISE', name: 'Enterprise', price: 'Custom', period: '', features: ['Everything in Pro', 'Team accounts', 'Dedicated support'] },
];

export default function Subscription() {
  const [user, setUser] = useState(getStoredUser());
  const [payingPlan, setPayingPlan] = useState<PayablePlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onUpgrade(plan: PayablePlan, planName: string) {
    if (plan === 'ENTERPRISE') {
      window.location.href = 'mailto:support@legallensai.app?subject=Enterprise plan inquiry';
      return;
    }
    setError(null);
    setSuccess(null);
    setPayingPlan(plan);
    try {
      await loadRazorpayScript();
      const order = await createOrder(plan);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'LegalLens AI',
        description: `Upgrade to ${planName}`,
        prefill: { contact: user?.phone },
        theme: { color: '#0B1220' },
        handler: async (response) => {
          try {
            const updatedUser = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              plan,
            });
            setStoredUser(updatedUser);
            setUser(updatedUser);
            setSuccess(`You're now on the ${planName} plan.`);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not confirm payment. If money was deducted, contact support.');
          } finally {
            setPayingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setPayingPlan(null),
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not start checkout.');
      setPayingPlan(null);
    }
  }

  return (
    <div className="cw-container">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Subscription & Billing
      </div>
      <p style={{ color: '#6B7280', fontSize: 13.5, marginTop: -6, marginBottom: 24 }}>
        Unlock unlimited documents and deeper AI insight.
      </p>

      {error && <div className="cw-error">{error}</div>}
      {success && (
        <div style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 12.5, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {PLANS.map((plan) => {
          const isCurrent = user?.plan === plan.key;
          const highlight = plan.key === 'PRO';
          return (
            <div
              key={plan.key}
              className="cw-card"
              style={{
                margin: 0,
                border: highlight ? '2px solid #D4AF37' : '1px solid #E5E7EB',
                background: highlight ? '#0B1220' : 'white',
                color: highlight ? 'white' : '#111827',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: highlight ? '#D4AF37' : '#0B1220' }}>{plan.name}</div>
              <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 18 }}>
                {plan.price}
                <span style={{ fontSize: 13, fontWeight: 500, color: highlight ? '#8D97A8' : '#6B7280' }}>{plan.period}</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: highlight ? '#C6CCDA' : '#6B7280' }}>
                    <CheckIcon style={{ width: 15, height: 15, color: '#D4AF37', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
              {isCurrent ? (
                <button className="cw-btn cw-btn-outline" disabled style={{ color: highlight ? 'white' : undefined }}>
                  Current Plan
                </button>
              ) : plan.key === 'FREE' ? (
                <button className="cw-btn cw-btn-outline" disabled>
                  —
                </button>
              ) : (
                <button
                  className={highlight ? 'cw-btn cw-btn-gold' : 'cw-btn cw-btn-navy'}
                  disabled={payingPlan === plan.key}
                  onClick={() => onUpgrade(plan.key as PayablePlan, plan.name)}
                >
                  {payingPlan === plan.key ? 'Opening checkout…' : plan.key === 'ENTERPRISE' ? 'Contact us' : `Upgrade to ${plan.name}`}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
