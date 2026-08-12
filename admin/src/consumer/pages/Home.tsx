import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, listDocuments } from '../api';
import type { DocumentSummary } from '../types';
import { AlertIcon, CameraIcon, ChatIcon, ClipboardIcon, CreditCardIcon, DocumentIcon } from '../../icons';

function fileIcon(_fileType: string) {
  return { bg: '#EEF1F6', color: '#0B1220' };
}

function statusMeta(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', cls: 'cw-status-ready' };
  if (status === 'FAILED') return { label: 'Failed', cls: 'cw-status-failed' };
  return { label: 'Processing', cls: 'cw-status-pending' };
}

export default function Home() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listDocuments()
      .then(setDocuments)
      .catch(() => setError('Could not load your documents.'));
  }, []);

  const recent = (documents || []).slice(0, 6);

  return (
    <div className="cw-container">
      <div className="cw-hero">
        <h1>Welcome back, {user?.firstName || 'there'}</h1>
        <p>Upload any legal document and get AI-powered insights in seconds.</p>
        <button className="cw-btn cw-btn-outline" onClick={() => navigate('/app/upload')}>
          Analyze a Document
        </button>
        <div className="cw-hero-caption">Supports PDF, DOCX · Max 20MB</div>
      </div>

      <div className="cw-section-title">What would you like to do?</div>
      <div className="cw-actions-grid">
        <Link to="/app/upload" className="cw-action-card">
          <div className="cw-action-icon">
            <DocumentIcon />
          </div>
          <div className="cw-action-title">Analyze Document</div>
          <div className="cw-action-sub">Get AI insights and summaries</div>
        </Link>
        <Link to="/app/upload" className="cw-action-card">
          <div className="cw-action-icon">
            <ChatIcon />
          </div>
          <div className="cw-action-title">Ask Legal Question</div>
          <div className="cw-action-sub">Chat about one of your documents</div>
        </Link>
        <Link to="/app/documents" className="cw-action-card">
          <div className="cw-action-icon">
            <ClipboardIcon />
          </div>
          <div className="cw-action-title">My Documents</div>
          <div className="cw-action-sub">View all analyzed documents</div>
        </Link>
        <Link to="/app/subscription" className="cw-action-card">
          <div className="cw-action-icon">
            <CreditCardIcon />
          </div>
          <div className="cw-action-title">Subscription</div>
          <div className="cw-action-sub">Manage your plan</div>
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div id="recent" className="cw-section-title">
          Recent Documents
        </div>
        <Link to="/app/documents" style={{ color: '#B08D57', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
          See all
        </Link>
      </div>

      {error && <div className="cw-error">{error}</div>}

      {documents === null && !error && (
        <div className="cw-empty">
          <div className="cw-spinner" style={{ margin: '0 auto 12px' }} />
          Loading your documents…
        </div>
      )}

      {documents !== null && recent.length === 0 && (
        <div className="cw-empty">
          <AlertIcon style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
          <div>No documents yet. Upload your first one above.</div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="cw-table-wrap">
          <table className="cw-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Status</th>
                <th>Type</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((doc) => {
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
