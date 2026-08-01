import { useEffect, useState } from 'react';
import { AdminDocument, ApiError, fetchDocuments } from '../api';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 25;

function ownerLabel(d: AdminDocument) {
  return d.user.name || d.user.email || d.user.phone || 'Unknown';
}

export default function Documents() {
  const [documents, setDocuments] = useState<AdminDocument[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments({ page, pageSize: PAGE_SIZE, search })
      .then((res) => {
        setDocuments(res.data);
        setTotal(res.total);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 403) {
          setError("Your account doesn't have admin access.");
        } else {
          setError('Failed to load documents.');
        }
      });
  }, [page, search]);

  if (error) return <div className="empty-state">{error}</div>;
  if (!documents) {
    return (
      <div className="page-loading">
        <span className="spinner" />
        Loading documents…
      </div>
    );
  }

  return (
    <div>
      <div className="stat-row">
        <div className="stat-card">
          <div className="value">{total}</div>
          <div className="label">Total documents</div>
        </div>
        <div className="stat-card">
          <div className="value">{documents.filter((d) => d.status === 'READY').length}</div>
          <div className="label">Ready (this page)</div>
        </div>
        <div className="stat-card">
          <div className="value">{documents.filter((d) => d.status === 'FAILED').length}</div>
          <div className="label">Failed (this page)</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h3>All documents</h3>
          <span className="hint">{total} total</span>
        </div>
        <div className="panel-toolbar">
          <input
            className="search-input"
            placeholder="Search by file name or owner…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {documents.length === 0 ? (
          <div className="empty-state">No documents match.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Status</th>
                <th>Owner</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="cell-name">{d.fileName}</div>
                  </td>
                  <td>{d.documentType || '—'}</td>
                  <td>
                    <span className={`badge badge-${d.status.toLowerCase()}`}>{d.status}</span>
                  </td>
                  <td>{ownerLabel(d)}</td>
                  <td>{new Date(d.createdAt).toLocaleDateString()}</td>
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
