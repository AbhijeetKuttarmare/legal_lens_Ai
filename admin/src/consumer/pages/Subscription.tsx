import { useEffect, useState } from 'react';
import {
  ApiError,
  addTeamMember,
  createCreditOrder,
  createOrder,
  createOrganization,
  getMyOrganization,
  getStoredUser,
  removeTeamMember,
  setStoredUser,
  verifyCreditOrder,
  verifyPayment,
  verifyTeamSubscription,
} from '../api';
import type { CreditPack, Organization, PayablePlan, SeatTier } from '../types';
import { loadRazorpayScript } from '../razorpay';
import { CheckIcon } from '../../icons';

const CREDIT_PACKS: { key: CreditPack; credits: number; price: string }[] = [
  { key: 'PACK_5', credits: 5, price: '₹249' },
  { key: 'PACK_10', credits: 10, price: '₹449' },
];

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
    price: '₹2,000',
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
  {
    key: 'ENTERPRISE',
    name: 'Max',
    price: '₹11,999',
    period: '/month',
    features: ['Everything in Pro', 'Highest priority processing', 'Dedicated support'],
  },
];

const SEAT_PRICES: Record<SeatTier, { label: string; price: string }> = {
  STANDARD: { label: 'Standard seat', price: '₹2,999' },
  PREMIUM: { label: 'Premium seat', price: '₹14,999' },
};

const TEAM_FEATURES = [
  'Everything in Pro, per member',
  'Central billing for the whole team',
  'Owner adds/removes members anytime',
  'Each member gets their own private documents',
  '2–150 members',
];

export default function Subscription() {
  const [user, setUser] = useState(getStoredUser());
  const [tab, setTab] = useState<'individual' | 'team'>('individual');
  const [payingPlan, setPayingPlan] = useState<PayablePlan | null>(null);
  const [payingPack, setPayingPack] = useState<CreditPack | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [org, setOrg] = useState<Organization | null | undefined>(undefined);
  const [seatTier, setSeatTier] = useState<SeatTier>('STANDARD');
  const [seatCount, setSeatCount] = useState(2);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [memberPhone, setMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function loadOrg() {
    getMyOrganization()
      .then(setOrg)
      .catch(() => setOrg(null));
  }

  useEffect(() => {
    if (tab === 'team' && org === undefined) loadOrg();
  }, [tab, org]);

  async function onUpgrade(plan: PayablePlan, planName: string) {
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
        name: 'Clauzera AI',
        description: `Upgrade to ${planName}`,
        prefill: { contact: user?.phone },
        theme: { color: '#0B1220' },
        handler: async (response) => {
          try {
            const updatedUser = await verifyPayment({
              razorpayOrderId: response.razorpay_order_id!,
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

  async function onBuyCredits(pack: CreditPack, credits: number) {
    setError(null);
    setSuccess(null);
    setPayingPack(pack);
    try {
      await loadRazorpayScript();
      const order = await createCreditOrder(pack);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Clauzera AI',
        description: `${credits} document credits`,
        prefill: { contact: user?.phone },
        theme: { color: '#0B1220' },
        handler: async (response) => {
          try {
            const updatedUser = await verifyCreditOrder({
              razorpayOrderId: response.razorpay_order_id!,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              pack,
            });
            setStoredUser(updatedUser);
            setUser(updatedUser);
            setSuccess(`${credits} document credits added to your account.`);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not confirm payment. If money was deducted, contact support.');
          } finally {
            setPayingPack(null);
          }
        },
        modal: {
          ondismiss: () => setPayingPack(null),
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not start checkout.');
      setPayingPack(null);
    }
  }

  async function onGetTeamPlan() {
    setError(null);
    setSuccess(null);
    setCreatingTeam(true);
    try {
      await loadRazorpayScript();
      const order = await createOrganization(seatTier, seatCount);

      const razorpay = new window.Razorpay({
        key: order.keyId,
        subscription_id: order.razorpaySubscriptionId,
        name: 'Clauzera AI',
        description: `Team plan — ${SEAT_PRICES[seatTier].label} × ${seatCount}`,
        prefill: { contact: user?.phone },
        theme: { color: '#0B1220' },
        handler: async (response) => {
          try {
            await verifyTeamSubscription({
              razorpaySubscriptionId: response.razorpay_subscription_id!,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            setSuccess('Your team plan is active. Start inviting members below.');
            loadOrg();
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not confirm subscription. If money was deducted, contact support.');
          } finally {
            setCreatingTeam(false);
          }
        },
        modal: {
          ondismiss: () => setCreatingTeam(false),
        },
      });
      razorpay.open();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not start checkout.');
      setCreatingTeam(false);
    }
  }

  async function onAddMember(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAddingMember(true);
    try {
      await addTeamMember(memberPhone);
      setMemberPhone('');
      setSuccess('Member added.');
      loadOrg();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add member.');
    } finally {
      setAddingMember(false);
    }
  }

  async function onRemoveMember(userId: string) {
    setError(null);
    setRemovingId(userId);
    try {
      await removeTeamMember(userId);
      loadOrg();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not remove member.');
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="cw-container">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Subscription & Billing
      </div>
      <p style={{ color: '#6B7280', fontSize: 13.5, marginTop: -6, marginBottom: 20 }}>
        Unlock unlimited documents and deeper AI insight.
      </p>

      <div className="cw-plan-tabs">
        <span className={tab === 'individual' ? 'active' : ''} onClick={() => setTab('individual')}>
          Individual
        </span>
        <span className={tab === 'team' ? 'active' : ''} onClick={() => setTab('team')}>
          Team and Enterprise
        </span>
      </div>

      {error && <div className="cw-error">{error}</div>}
      {success && (
        <div style={{ background: '#DCFCE7', color: '#16A34A', fontSize: 12.5, padding: '10px 12px', borderRadius: 10, marginBottom: 16 }}>
          {success}
        </div>
      )}

      {tab === 'individual' && (
        <>
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
                    border: highlight ? '2px solid var(--cw-gold-bright)' : '1px solid var(--cw-dark-border)',
                    background: 'var(--cw-dark-surface)',
                    boxShadow: highlight ? '0 0 24px rgba(232,169,61,0.15)' : undefined,
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {highlight && (
                    <span
                      style={{
                        position: 'absolute',
                        top: -11,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'var(--cw-gold-bright)',
                        color: 'var(--cw-navy)',
                        fontSize: 10.5,
                        fontWeight: 800,
                        padding: '3px 12px',
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      MOST POPULAR
                    </span>
                  )}
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: highlight ? 'var(--cw-gold-bright)' : 'white' }}>{plan.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 18 }}>
                    {plan.price}
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--cw-dark-text-muted)' }}>{plan.period}</span>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                    {plan.features.map((f) => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--cw-dark-text-muted)' }}>
                        <CheckIcon style={{ width: 15, height: 15, color: 'var(--cw-gold-bright)', flexShrink: 0 }} />
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
                      className={highlight ? 'cw-btn cw-btn-outline' : 'cw-btn cw-btn-navy'}
                      disabled={payingPlan === plan.key}
                      onClick={() => onUpgrade(plan.key as PayablePlan, plan.name)}
                    >
                      {payingPlan === plan.key ? 'Opening checkout…' : `Upgrade to ${plan.name}`}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {user?.plan === 'FREE' && (
            <>
              <div className="cw-section-title">Document Credits</div>
              <p style={{ color: '#6B7280', fontSize: 13.5, marginTop: -6, marginBottom: 18 }}>
                Don't need a subscription? Buy one-time credits to analyze extra documents on the Free plan.
                {user && user.documentCredits > 0 && (
                  <strong style={{ color: '#0B1220' }}> You have {user.documentCredits} credit{user.documentCredits === 1 ? '' : 's'}.</strong>
                )}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
                {CREDIT_PACKS.map((pack) => (
                  <div key={pack.key} className="cw-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: '#0B1220' }}>
                      {pack.credits} document credits
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 16, color: '#0B1220' }}>{pack.price}</div>
                    <p style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 18, flex: 1 }}>
                      Each credit lets you upload and analyze one document beyond your plan's limit. Credits never
                      expire.
                    </p>
                    <button
                      className="cw-btn cw-btn-navy"
                      disabled={payingPack === pack.key}
                      onClick={() => onBuyCredits(pack.key, pack.credits)}
                    >
                      {payingPack === pack.key ? 'Opening checkout…' : 'Buy credits'}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'team' && (
        <>
          {org === undefined && <p style={{ color: '#6B7280', fontSize: 13.5 }}>Loading…</p>}

          {org === null && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18 }}>
              <div className="cw-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 4 }}>2–150 users</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: '#0B1220' }}>Team</div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 18 }}>Predictable pricing per seat</div>

                <div className="cw-plan-tabs" style={{ marginBottom: 16 }}>
                  <span className={seatTier === 'STANDARD' ? 'active' : ''} onClick={() => setSeatTier('STANDARD')}>
                    Standard
                  </span>
                  <span className={seatTier === 'PREMIUM' ? 'active' : ''} onClick={() => setSeatTier('PREMIUM')}>
                    Premium
                  </span>
                </div>

                <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4, color: '#0B1220' }}>
                  {SEAT_PRICES[seatTier].price}
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#6B7280' }}>/seat/mo</span>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 18 }}>{SEAT_PRICES[seatTier].label}, billed monthly</div>

                <label style={{ fontSize: 12.5, fontWeight: 600, color: '#0B1220', marginBottom: 6, display: 'block' }}>
                  Number of seats
                </label>
                <input
                  type="number"
                  min={2}
                  max={150}
                  value={seatCount}
                  onChange={(e) => setSeatCount(Math.max(2, Math.min(150, Number(e.target.value))))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    fontSize: 14,
                    marginBottom: 18,
                  }}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {TEAM_FEATURES.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' }}>
                      <CheckIcon style={{ width: 15, height: 15, color: '#B08D57', flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>

                <button className="cw-btn cw-btn-navy" disabled={creatingTeam} onClick={onGetTeamPlan}>
                  {creatingTeam ? 'Opening checkout…' : 'Get Team plan'}
                </button>
              </div>

              <div className="cw-card" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginBottom: 4 }}>20+ users</div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 4, color: '#0B1220' }}>Enterprise</div>
                <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 18 }}>Custom volume &amp; support</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                  {[
                    'Everything in Team',
                    'Volume pricing for 20+ seats',
                    'Dedicated account manager',
                    'Custom contract & invoicing',
                    'Priority onboarding',
                  ].map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6B7280' }}>
                      <CheckIcon style={{ width: 15, height: 15, color: '#B08D57', flexShrink: 0 }} />
                      {f}
                    </div>
                  ))}
                </div>
                <button
                  className="cw-btn cw-btn-outline"
                  onClick={() => {
                    window.location.href = 'mailto:support@clauzera.com?subject=Enterprise plan inquiry';
                  }}
                >
                  Contact us
                </button>
              </div>
            </div>
          )}

          {org && (
            <div className="cw-card" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#0B1220' }}>{org.name}</div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background: org.subscriptionStatus === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                    color: org.subscriptionStatus === 'ACTIVE' ? '#16A34A' : '#B45309',
                  }}
                >
                  {org.subscriptionStatus}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: '#6B7280', marginBottom: 20 }}>
                {SEAT_PRICES[org.seatTier].label} · {org.members.length}/{org.seatCount} seats used · You are {org.role === 'OWNER' ? 'the owner' : 'a member'}
              </div>

              {org.role === 'OWNER' && org.subscriptionStatus === 'ACTIVE' && (
                <form onSubmit={onAddMember} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    required
                    style={{ flex: 1, padding: '9px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14 }}
                  />
                  <button
                    className="cw-btn cw-btn-navy"
                    type="submit"
                    disabled={addingMember || org.members.length >= org.seatCount}
                    style={{ width: 'auto', padding: '0 18px' }}
                  >
                    {addingMember ? 'Adding…' : 'Add member'}
                  </button>
                </form>
              )}

              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {org.members.map((m) => (
                    <tr key={m.userId} style={{ borderTop: '1px solid #EEF0F4' }}>
                      <td style={{ padding: '10px 0' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#0B1220' }}>
                          {m.name || m.email || m.phone || 'Unnamed'}
                          {m.role === 'OWNER' && (
                            <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: '#B08D57' }}>OWNER</span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280' }}>{m.phone}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {org.role === 'OWNER' && m.role !== 'OWNER' && (
                          <button
                            className="cw-btn cw-btn-outline"
                            disabled={removingId === m.userId}
                            onClick={() => onRemoveMember(m.userId)}
                            style={{ width: 'auto', padding: '6px 14px', fontSize: 12.5 }}
                          >
                            {removingId === m.userId ? 'Removing…' : 'Remove'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
