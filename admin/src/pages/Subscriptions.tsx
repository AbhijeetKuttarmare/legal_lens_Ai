import { useEffect, useState } from 'react';
import { AdminSubscription, ApiError, FeatureTrialKey, fetchSubscriptions, setFeatureTrial, setPlan, setTrialLimit } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

const FEATURE_TRIALS: { key: FeatureTrialKey; field: keyof AdminSubscription; label: string }[] = [
  { key: 'COMPARE', field: 'compareTrialUntil', label: 'Compare' },
  { key: 'TEMPLATES', field: 'templatesTrialUntil', label: 'Templates' },
  { key: 'EXPORT', field: 'exportTrialUntil', label: 'Export' },
  { key: 'CHAT', field: 'chatTrialUntil', label: 'Chat' },
];

const DURATIONS = [7, 14, 30];

const PLAN_OPTIONS: { key: 'FREE' | 'PRO' | 'ENTERPRISE'; label: string }[] = [
  { key: 'FREE', label: 'Free' },
  { key: 'PRO', label: 'Pro' },
  { key: 'ENTERPRISE', label: 'Max' },
];

// 0 is a sentinel for "no expiry" (permanent) — mapped to days: null before the API call.
const PLAN_DURATIONS = [3, 7, 14, 30, 0];

function planDurationLabel(d: number) {
  return d === 0 ? 'No expiry' : `${d} days`;
}

function ownerLabel(s: AdminSubscription) {
  return s.name || s.email || s.phone || 'Unknown';
}

function trialLabel(limit: number | null) {
  if (limit === null) return null;
  if (limit === -1) return 'Unlimited (trial)';
  return `${limit} doc${limit === 1 ? '' : 's'} (trial)`;
}

function daysLeft(iso: string | null) {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export default function Subscriptions() {
  const [subs, setSubs] = useState<AdminSubscription[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftLimits, setDraftLimits] = useState<Record<string, string>>({});
  const [durations, setDurations] = useState<Record<string, number>>({});
  const [planDrafts, setPlanDrafts] = useState<Record<string, 'FREE' | 'PRO' | 'ENTERPRISE'>>({});
  const [planDurations, setPlanDurations] = useState<Record<string, number>>({});

  function load() {
    fetchSubscriptions({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setSubs(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load subscriptions.');
        }
      });
  }

  useEffect(load, [page, search]);

  async function applyTrial(userId: string, limit: number | null) {
    setBusyId(userId);
    try {
      await setTrialLimit(userId, limit);
      setDraftLimits((d) => ({ ...d, [userId]: '' }));
      load();
    } catch {
      // no-op — row simply won't update; the controls remain actionable
    } finally {
      setBusyId(null);
    }
  }

  async function applyPlan(userId: string, plan: 'FREE' | 'PRO' | 'ENTERPRISE', days: number | null) {
    setBusyId(`${userId}:plan`);
    try {
      await setPlan(userId, plan, days);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not set this plan.');
    } finally {
      setBusyId(null);
    }
  }

  async function applyFeatureTrial(userId: string, feature: FeatureTrialKey, days: number | null) {
    const busyKey = `${userId}:${feature}`;
    setBusyId(busyKey);
    try {
      await setFeatureTrial(userId, feature, days);
      load();
    } catch {
      // no-op — row simply won't update; the controls remain actionable
    } finally {
      setBusyId(null);
    }
  }

  if (error) return <div className="empty-state">{error}</div>;
  if (!subs) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading subscriptions…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total accounts</div>
        </div>
        <div className="stat-card">
          <div className="value">{subs.filter((s) => s.trialDocumentLimit !== null).length}</div>
          <div className="label">On a trial override (this page)</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>Subscriptions &amp; trial access</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {subs.length === 0 ? (
          <div className="empty-state">No accounts match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Plan</th>
                <th>Set plan</th>
                <th>Docs used</th>
                <th>Trial status</th>
                <th>Grant document trial</th>
                <th>Feature trials</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const label = trialLabel(s.trialDocumentLimit);
                const busy = busyId === s.id;
                const duration = durations[s.id] ?? 7;
                const planBusy = busyId === `${s.id}:plan`;
                const planDaysLeft = daysLeft(s.planExpiresAt);
                const draftPlan = planDrafts[s.id] ?? s.plan;
                const draftPlanDuration = planDurations[s.id] ?? 3;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-name">{ownerLabel(s)}</div>
                      <div className="cell-sub">{s.email || s.phone}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.plan.toLowerCase()}`}>{s.plan}</span>
                      {planDaysLeft !== null && (
                        <div className="cell-sub" style={{ marginTop: 4 }}>
                          Admin-granted · {planDaysLeft}d left
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 170 }}>
                        <select
                          value={draftPlan}
                          onChange={(e) => setPlanDrafts((d) => ({ ...d, [s.id]: e.target.value as 'FREE' | 'PRO' | 'ENTERPRISE' }))}
                          style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11.5 }}
                        >
                          {PLAN_OPTIONS.map((p) => (
                            <option key={p.key} value={p.key}>
                              {p.label}
                            </option>
                          ))}
                        </select>
                        {draftPlan !== 'FREE' && (
                          <select
                            value={draftPlanDuration}
                            onChange={(e) => setPlanDurations((d) => ({ ...d, [s.id]: Number(e.target.value) }))}
                            style={{ padding: '4px 6px', border: '1px solid var(--border)', borderRadius: 6, fontSize: 11.5 }}
                          >
                            {PLAN_DURATIONS.map((d) => (
                              <option key={d} value={d}>
                                {planDurationLabel(d)}
                              </option>
                            ))}
                          </select>
                        )}
                        <button
                          className="icon-button"
                          disabled={planBusy}
                          onClick={() => applyPlan(s.id, draftPlan, draftPlan === 'FREE' ? null : draftPlanDuration || null)}
                        >
                          {planBusy ? '…' : 'Apply'}
                        </button>
                      </div>
                    </td>
                    <td>{s._count.documents}</td>
                    <td>
                      {label ? <span className="badge badge-pro">{label}</span> : <span className="cell-sub">None</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="number"
                          min={0}
                          placeholder="e.g. 5"
                          value={draftLimits[s.id] ?? ''}
                          onChange={(e) =>
                            setDraftLimits((d) => ({ ...d, [s.id]: e.target.value }))
                          }
                          style={{
                            width: 70,
                            padding: '5px 8px',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            fontSize: 12.5,
                          }}
                        />
                        <button
                          className="icon-button"
                          disabled={busy || !draftLimits[s.id]}
                          onClick={() => applyTrial(s.id, Number(draftLimits[s.id]))}
                        >
                          Set
                        </button>
                        <button className="icon-button" disabled={busy} onClick={() => applyTrial(s.id, -1)}>
                          Unlimited
                        </button>
                        {s.trialDocumentLimit !== null && (
                          <button
                            className="icon-button danger"
                            disabled={busy}
                            onClick={() => applyTrial(s.id, null)}
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 220 }}>
                        <select
                          value={duration}
                          onChange={(e) => setDurations((d) => ({ ...d, [s.id]: Number(e.target.value) }))}
                          style={{
                            padding: '4px 6px',
                            border: '1px solid var(--border)',
                            borderRadius: 6,
                            fontSize: 11.5,
                            width: 100,
                          }}
                        >
                          {DURATIONS.map((d) => (
                            <option key={d} value={d}>
                              {d} days
                            </option>
                          ))}
                        </select>
                        {FEATURE_TRIALS.map((f) => {
                          const iso = s[f.field] as string | null;
                          const remaining = daysLeft(iso);
                          const active = remaining !== null;
                          const featureBusy = busyId === `${s.id}:${f.key}`;
                          return (
                            <div key={f.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                              <span style={{ fontSize: 11.5 }}>
                                {f.label}
                                {active && (
                                  <span className="badge badge-pro" style={{ marginLeft: 6 }}>
                                    {remaining}d left
                                  </span>
                                )}
                              </span>
                              {active ? (
                                <button
                                  className="icon-button danger"
                                  disabled={featureBusy}
                                  onClick={() => applyFeatureTrial(s.id, f.key, null)}
                                >
                                  Clear
                                </button>
                              ) : (
                                <button
                                  className="icon-button"
                                  disabled={featureBusy}
                                  onClick={() => applyFeatureTrial(s.id, f.key, duration)}
                                >
                                  Grant
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
