import { useEffect, useState } from 'react';
import { AdminErrorLog, ApiError, fetchExceptions } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

export default function ExceptionLog() {
  const [entries, setEntries] = useState<AdminErrorLog[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExceptions({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setEntries(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load exception log.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!entries) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading exception log…
      </div>
    );
  }

  return (
    <div>
      <div className="panel">
        <div className="panel-header">
          <h3>Server errors (5xx)</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by message or route…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {entries.length === 0 ? (
          <div className="empty-state">{search ? 'No errors match.' : 'No server errors logged. Good sign.'}</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Message</th>
                <th>Route</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                  style={{ cursor: e.stack ? 'pointer' : 'default' }}
                >
                  <td colSpan={expanded === e.id ? 4 : 1}>
                    {e.message}
                    {expanded === e.id && e.stack && (
                      <pre
                        style={{
                          marginTop: 8,
                          fontSize: 11.5,
                          whiteSpace: 'pre-wrap',
                          color: 'var(--text-muted)',
                          background: 'var(--bg)',
                          padding: 10,
                          borderRadius: 6,
                        }}
                      >
                        {e.stack}
                      </pre>
                    )}
                  </td>
                  {expanded !== e.id && (
                    <>
                      <td className="mono">
                        {e.method} {e.path}
                      </td>
                      <td>
                        <span className="badge badge-failed">{e.statusCode}</span>
                      </td>
                      <td>{new Date(e.createdAt).toLocaleString()}</td>
                    </>
                  )}
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
