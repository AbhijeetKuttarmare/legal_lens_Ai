import { useEffect, useState } from 'react';
import { AdminSubscription, ApiError, fetchSubscriptions, setTrialLimit } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function ownerLabel(s: AdminSubscription) {
  return s.name || s.email || s.phone || 'Unknown';
}

function trialLabel(limit: number | null) {
  if (limit === null) return null;
  if (limit === -1) return 'Unlimited (trial)';
  return `${limit} doc${limit === 1 ? '' : 's'} (trial)`;
}

export default function Subscriptions() {
  const [subs, setSubs] = useState<AdminSubscription[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [draftLimits, setDraftLimits] = useState<Record<string, string>>({});

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
                <th>Docs used</th>
                <th>Trial status</th>
                <th>Grant trial access</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s) => {
                const label = trialLabel(s.trialDocumentLimit);
                const busy = busyId === s.id;
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="cell-name">{ownerLabel(s)}</div>
                      <div className="cell-sub">{s.email || s.phone}</div>
                    </td>
                    <td>
                      <span className={`badge badge-${s.plan.toLowerCase()}`}>{s.plan}</span>
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
