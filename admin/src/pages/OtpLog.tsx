import { useEffect, useState } from 'react';
import { AdminOtpLogEntry, ApiError, fetchOtpLog } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

export default function OtpLog() {
  const [entries, setEntries] = useState<AdminOtpLogEntry[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOtpLog({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load OTP log.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!entries) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading OTP log…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total OTP events</div>
        </div>
        <div className="stat-card">
          <div className="value">{entries.filter((e) => !e.success).length}</div>
          <div className="label">Failed (this page)</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>OTP requests &amp; verifications</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by phone number…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div style={{ padding: '10px 20px 0', fontSize: 12, color: 'var(--text-muted)' }}>
          Codes are never stored — only who requested/verified an OTP, when, and whether it succeeded.
        </div>
        {entries.length === 0 ? (
          <div className="empty-state">{search ? 'No OTP events match.' : 'No OTP activity yet.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Phone</th>
                <th>Event</th>
                <th>Result</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="mono">{e.phone}</td>
                  <td>{e.action === 'REQUESTED' ? 'Requested' : 'Verified'}</td>
                  <td>
                    <span className={`badge ${e.success ? 'badge-ready' : 'badge-failed'}`}>
                      {e.success ? 'Success' : 'Failed'}
                    </span>
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
