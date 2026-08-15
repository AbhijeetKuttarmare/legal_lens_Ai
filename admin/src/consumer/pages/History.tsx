import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deleteDocument, listDocuments } from '../api';
import type { DocumentSummary } from '../types';
import { DotsVerticalIcon, DocumentIcon, FolderIcon } from '../../icons';

type FilterKey = 'ALL' | 'READY' | 'FAILED' | 'PENDING';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'ALL', label: 'All Documents' },
  { key: 'READY', label: 'Analyzed' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'FAILED', label: 'Processing' },
];

function fileBadge(fileType: string) {
  if (fileType.includes('word') || fileType.includes('docx')) return { label: 'DOCX', bg: '#2563EB' };
  return { label: 'PDF', bg: '#DC2626' };
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusMeta(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', cls: 'cw-status-ready' };
  if (status === 'FAILED') return { label: 'Failed', cls: 'cw-status-failed' };
  if (status === 'PROCESSING') return { label: 'Analyzing', cls: 'cw-status-processing' };
  return { label: 'Pending', cls: 'cw-status-pending' };
}

export default function History() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('ALL');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    setOpenMenuId(null);
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
          <div style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13 }}>All your legal documents in one place</div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="cw-input-plain"
            style={{ marginBottom: 0, width: 220, maxWidth: '100%', flex: '1 1 180px' }}
            placeholder="Search by file name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="cw-input-plain"
            style={{ marginBottom: 0, width: 170, maxWidth: '100%', flex: '1 1 140px' }}
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
        <div className="cw-table-wrap" style={{ marginTop: 16 }}>
          <div className="cw-empty" style={{ padding: '56px 20px' }}>
            <div
              style={{
                width: 56,
                height: 56,
                margin: '0 auto 14px',
                borderRadius: 14,
                background: 'var(--cw-dark-surface-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--cw-gold-bright)',
              }}
            >
              <FolderIcon style={{ width: 26, height: 26 }} />
            </div>
            <div style={{ color: 'var(--cw-dark-text)', fontWeight: 600, marginBottom: 4 }}>More documents will appear here</div>
            <div>Upload and analyze your legal documents</div>
          </div>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="cw-table-wrap" style={{ marginTop: 16, overflowY: 'visible' }}>
          <table className="cw-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Type</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => {
                const badge = fileBadge(doc.fileType);
                const status = statusMeta(doc.status);
                const size = formatFileSize(doc.fileSize);
                return (
                  <tr key={doc.id} onClick={() => navigate(`/app/report/${doc.id}`)}>
                    <td>
                      <div className="cw-doc-name-cell">
                        <div className="cw-doc-icon" style={{ background: 'var(--cw-dark-surface-2)', color: 'var(--cw-dark-text)', position: 'relative' }}>
                          <DocumentIcon style={{ width: 18, height: 18 }} />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: -3,
                              left: -3,
                              background: badge.bg,
                              color: 'var(--cw-dark-text)',
                              fontSize: 8,
                              fontWeight: 800,
                              padding: '1px 4px',
                              borderRadius: 4,
                            }}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div>
                          <div className="cw-doc-name">{doc.fileName}</div>
                          {size && <div className="cw-doc-size">{size}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`cw-status-pill ${status.cls}`}>{status.label}</span>
                    </td>
                    <td style={{ color: 'var(--cw-dark-text-muted)' }}>{doc.documentType?.replace(/_/g, ' ') || '—'}</td>
                    <td className="cw-doc-date">
                      {new Date(doc.createdAt).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="cw-link-btn"
                        style={{ padding: 6 }}
                        onClick={() => setOpenMenuId(openMenuId === doc.id ? null : doc.id)}
                      >
                        <DotsVerticalIcon style={{ width: 16, height: 16 }} />
                      </button>
                      {openMenuId === doc.id && (
                        <div
                          onMouseLeave={() => setOpenMenuId(null)}
                          style={{
                            position: 'absolute',
                            right: 18,
                            top: 36,
                            background: 'var(--cw-dark-surface-2)',
                            border: '1px solid var(--cw-dark-border)',
                            borderRadius: 10,
                            padding: 6,
                            zIndex: 10,
                            minWidth: 130,
                            boxShadow: '0 10px 24px rgba(0,0,0,0.4)',
                          }}
                        >
                          <button
                            className="cw-link-btn"
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px' }}
                            onClick={() => navigate(`/app/report/${doc.id}`)}
                          >
                            View Report
                          </button>
                          <button
                            className="cw-link-btn"
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', color: '#F87171' }}
                            disabled={deletingId === doc.id}
                            onClick={(e) => onDelete(doc.id, e)}
                          >
                            {deletingId === doc.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      )}
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
