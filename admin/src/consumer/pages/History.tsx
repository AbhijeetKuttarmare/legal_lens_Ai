import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDocument, listDocuments } from '../api';
import type { DocumentSummary } from '../types';
import { AlertIcon, CameraIcon } from '../../icons';

type FilterKey = 'ALL' | 'READY' | 'FAILED' | 'PENDING';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All Documents' },
  { key: 'READY', label: 'Analyzed' },
  { key: 'FAILED', label: 'Failed' },
  { key: 'PENDING', label: 'Processing' },
];

function fileIcon(fileType: string) {
  if (fileType === 'application/pdf') return { bg: '#FEE2E2', color: '#DC2626' };
  if (fileType.includes('wordprocessingml')) return { bg: '#DBEAFE', color: '#2563EB' };
  if (fileType.startsWith('image/')) return { bg: '#DCFCE7', color: '#16A34A' };
  return { bg: '#EEF1F6', color: '#0B1220' };
}

function statusMeta(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', cls: 'cw-status-ready' };
  if (status === 'FAILED') return { label: 'Failed', cls: 'cw-status-failed' };
  return { label: 'Processing', cls: 'cw-status-pending' };
}

export default function History() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function reload() {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError('Could not load your documents.'));
  }

  useEffect(reload, []);

  const filtered = useMemo(() => {
    let list = documents || [];
    if (filter === 'PENDING') list = list.filter((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED');
    else if (filter !== 'ALL') list = list.filter((d) => d.status === filter);

    const q = search.trim().toLowerCase();
    if (q) list = list.filter((d) => d.fileName.toLowerCase().includes(q));

    const sorted = [...list];
    if (sort === 'newest') sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (sort === 'oldest') sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    else sorted.sort((a, b) => a.fileName.localeCompare(b.fileName));
    return sorted;
  }, [documents, filter, search, sort]);

  async function onDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!window.confirm('Delete this document? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await deleteDocument(id);
      setDocuments((prev) => (prev ? prev.filter((d) => d.id !== id) : prev));
    } catch {
      setError('Could not delete document.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="cw-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="cw-section-title" style={{ margin: '0 0 4px' }}>
            My Documents
          </div>
          <div style={{ color: '#6B7280', fontSize: 13 }}>All your legal documents in one place</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="cw-input-plain"
            style={{ marginBottom: 0, width: 220 }}
            placeholder="Search by file name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="cw-input-plain"
            style={{ marginBottom: 0, width: 160 }}
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
          >
            <option value="newest">Recently Added</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>

      <div className="cw-lang-row" style={{ marginTop: 20 }}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`cw-lang-chip${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && <div className="cw-error">{error}</div>}

      {documents === null && !error && (
        <div className="cw-empty">
          <div className="cw-spinner" style={{ margin: '0 auto 12px' }} />
          Loading your documents…
        </div>
      )}

      {documents !== null && filtered.length === 0 && (
        <div className="cw-empty">
          <AlertIcon style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
          <div>No documents in this filter.</div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="cw-table-wrap" style={{ marginTop: 16 }}>
          <table className="cw-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const icon = fileIcon(doc.fileType);
                const status = statusMeta(doc.status);
                return (
                  <tr key={doc.id} onClick={() => navigate(`/app/report/${doc.id}`)}>
                    <td>
                      <div className="cw-doc-name-cell">
                        <div className="cw-doc-icon" style={{ background: icon.bg, color: icon.color }}>
                          <CameraIcon />
                        </div>
                        <span className="cw-doc-name">{doc.fileName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`cw-status-pill ${status.cls}`}>{status.label}</span>
                    </td>
                    <td style={{ color: '#6B7280' }}>{doc.documentType?.replace(/_/g, ' ') || '—'}</td>
                    <td className="cw-doc-date">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button
                        className="cw-link-btn"
                        style={{ color: '#DC2626' }}
                        disabled={deletingId === doc.id}
                        onClick={(e) => onDelete(doc.id, e)}
                      >
                        {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
