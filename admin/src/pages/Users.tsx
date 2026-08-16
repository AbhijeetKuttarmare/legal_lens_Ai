import { useEffect, useState } from 'react';
import { AdminUser, ApiError, deleteUser, fetchUsers, getIdentity, toggleAdmin, toggleBan } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function initials(u: AdminUser) {
  const label = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.phone || '?';
  return label.trim()[0]?.toUpperCase() ?? '?';
}

export default function Users() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const selfId = getIdentity()?.id;

  function load() {
    fetchUsers({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setUsers(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load users.');
        }
      });
  }

  useEffect(load, [page, search]);

  async function handleToggleAdmin(userId: string) {
    setBusyId(userId);
    try {
      await toggleAdmin(userId);
      load();
    } catch {
      // no-op — row simply won't update; the button remains actionable
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleBan(u: AdminUser) {
    const label = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.phone || 'this user';
    if (u.isBanned) {
      if (!window.confirm(`Unban ${label}? They will be able to sign in again immediately.`)) return;
      setBusyId(u.id);
      try {
        await toggleBan(u.id);
        load();
      } catch (err) {
        window.alert(err instanceof ApiError ? err.message : 'Could not unban this user.');
      } finally {
        setBusyId(null);
      }
      return;
    }

    if (!window.confirm(`Ban ${label}? They will be signed out and blocked from using the app immediately.`)) return;
    const reason = window.prompt('Reason for ban (optional, shown in audit log only):') || undefined;
    setBusyId(u.id);
    try {
      await toggleBan(u.id, reason);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not ban this user.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(u: AdminUser) {
    const label = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || u.phone || 'this user';
    if (!window.confirm(`Delete ${label}? This permanently removes their account and all documents. This cannot be undone.`)) return;
    if (!window.confirm('Are you absolutely sure? This is your last chance to cancel.')) return;
    setBusyId(u.id);
    try {
      await deleteUser(u.id);
      load();
    } catch (err) {
      window.alert(err instanceof ApiError ? err.message : 'Could not delete this user.');
      setBusyId(null);
    }
  }

  if (error) return <div className="empty-state">{error}</div>;
  if (!users) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading users…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total users</div>
        </div>
        <div className="stat-card">
          <div className="value">{users.filter((u) => u.plan !== 'FREE').length}</div>
          <div className="label">Paying users (this page)</div>
        </div>
        <div className="stat-card">
          <div className="value">{users.filter((u) => u.isAdmin).length}</div>
          <div className="label">Admins (this page)</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>All users</h3>
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
        {users.length === 0 ? (
          <div className="empty-state">No users match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Contact</th>
                <th>Plan</th>
                <th>Docs</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="cell-user">
                      <div className="row-avatar">{initials(u)}</div>
                      <div>
                        <div className="cell-name">
                          {u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Unnamed user'}
                          {u.isAdmin && (
                            <span className="badge badge-admin" style={{ marginLeft: 6 }}>
                              Admin
                            </span>
                          )}
                          {u.isBanned && (
                            <span className="badge" style={{ marginLeft: 6, background: '#FEE2E2', color: '#DC2626' }}>
                              Banned
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{u.email || '—'}</div>
                    <div className="cell-sub">{u.phone || ''}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${u.plan.toLowerCase()}`}>{u.plan}</span>
                  </td>
                  <td>{u._count.documents}</td>
                  <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    {u.id === selfId ? (
                      <span className="cell-sub">You</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          className="icon-button"
                          disabled={busyId === u.id}
                          onClick={() => handleToggleAdmin(u.id)}
                        >
                          {busyId === u.id ? '…' : u.isAdmin ? 'Revoke admin' : 'Make admin'}
                        </button>
                        {!u.isAdmin && (
                          <>
                            <button
                              className="icon-button"
                              disabled={busyId === u.id}
                              onClick={() => handleToggleBan(u)}
                            >
                              {busyId === u.id ? '…' : u.isBanned ? 'Unban' : 'Ban'}
                            </button>
                            <button
                              className="icon-button"
                              style={{ color: '#DC2626', borderColor: '#DC2626' }}
                              disabled={busyId === u.id}
                              onClick={() => handleDelete(u)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
