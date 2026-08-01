import { useEffect, useState } from 'react';
import { AdminStats, ApiError, fetchStats } from '../api';
import { DocumentIcon, UsersIcon } from '../icons';

const PLAN_COLORS: Record<string, string> = {
  FREE: '#9CA3AF',
  PRO: '#3B82F6',
  ENTERPRISE: '#8B5CF6',
};

function formatInr(paise: number) {
  return `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats()
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load dashboard data.');
        }
      });
  }, []);

  if (error) return <div className="empty-state">{error}</div>;
  if (!stats) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading dashboard…
      </div>
    );
  }

  const maxPlanCount = Math.max(1, ...Object.values(stats.planCounts));

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="icon" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
            <UsersIcon />
          </div>
          <div className="value">{stats.totalUsers}</div>
          <div className="label">Total users</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ background: '#EDE9FE', color: '#6D28D9' }}>
            <UsersIcon />
          </div>
          <div className="value">{stats.payingUsers}</div>
          <div className="label">Paying users</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ background: '#F3F4F6', color: '#374151' }}>
            <DocumentIcon />
          </div>
          <div className="value">{stats.totalDocuments}</div>
          <div className="label">Total documents</div>
        </div>
        <div className="stat-card">
          <div className="icon" style={{ background: '#D1FAE5', color: '#047857' }}>
            <UsersIcon />
          </div>
          <div className="value">{formatInr(stats.totalRevenue)}</div>
          <div className="label">Revenue collected</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="panel">
          <div className="panel-header">
            <h3>Plan distribution</h3>
          </div>
          <div className="plan-bars">
            {(Object.keys(stats.planCounts) as Array<keyof typeof stats.planCounts>).map((plan) => (
              <div className="plan-bar-row" key={plan}>
                <div className="top">
                  <span className="name">{plan}</span>
                  <span className="count">{stats.planCounts[plan]}</span>
                </div>
                <div className="plan-bar-track">
                  <div
                    className="plan-bar-fill"
                    style={{
                      width: `${(stats.planCounts[plan] / maxPlanCount) * 100}%`,
                      background: PLAN_COLORS[plan],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h3>Recent signups</h3>
          </div>
          {stats.recentUsers.length === 0 ? (
            <div className="empty-state">No users yet.</div>
          ) : (
            <table>
              <tbody>
                {stats.recentUsers.map((u) => {
                  const label = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unnamed user';
                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="cell-user">
                          <div className="row-avatar">{(label || '?').trim()[0]?.toUpperCase()}</div>
                          <div>
                            <div className="cell-name">{label}</div>
                            <div className="cell-sub">{u.email || u.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="stat-row" style={{ marginTop: 20 }}>
        <div className="stat-card">
          <div className="value">
            {stats.averageRating ? stats.averageRating.toFixed(1) : '—'} <span style={{ fontSize: 14 }}>/ 5</span>
          </div>
          <div className="label">Average rating ({stats.reviewCount} reviews)</div>
        </div>
        <div className="stat-card">
          <div className="value">{stats.failedDocuments}</div>
          <div className="label">Failed documents</div>
        </div>
      </div>
    </div>
  );
}
