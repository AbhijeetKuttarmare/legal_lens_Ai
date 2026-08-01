import { useEffect, useState } from 'react';
import { AdminAuditLogEntry, ApiError, fetchAuditLog } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function actionLabel(action: string) {
  return action.replace(/_/g, ' ');
}

export default function AuditLog() {
  const [entries, setEntries] = useState<AdminAuditLogEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAuditLog({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load audit log.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!entries) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading audit log…
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <h3>Admin actions</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by admin, action or target…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {entries.length === 0 ? (
          <div className="empty-state">
            {search
              ? 'No audit entries match.'
              : 'No admin actions yet — actions like promoting/revoking admins from the Users tab will show up here.'}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Admin</th>
                <th>Action</th>
                <th>Target</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.adminLabel}</td>
                  <td>{actionLabel(e.action)}</td>
                  <td>
                    {e.targetType}
                    {e.metadata && typeof e.metadata === 'object' && 'targetLabel' in e.metadata
                      ? ` — ${(e.metadata as { targetLabel?: string }).targetLabel}`
                      : ''}
                  </td>
                  <td>{new Date(e.createdAt).toLocaleString()}</td>
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
