import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, listDocuments } from '../api';
import type { DocumentSummary } from '../types';
import {
  AlertIcon,
  CameraIcon,
  ChatIcon,
  ClipboardIcon,
  CreditCardIcon,
  DocumentIcon,
  GridIcon,
  ShieldIcon,
  TagIcon,
} from '../../icons';

function fileIcon(_fileType: string) {
  return { bg: '#EEF1F6', color: '#0B1220' };
}

function statusMeta(status: DocumentSummary['status']) {
  if (status === 'READY') return { label: 'Analyzed', cls: 'cw-status-ready' };
  if (status === 'FAILED') return { label: 'Failed', cls: 'cw-status-failed' };
  return { label: 'Processing', cls: 'cw-status-pending' };
}

function riskMeta(level?: 'LOW' | 'MEDIUM' | 'HIGH') {
  if (level === 'HIGH') return { label: 'High risk', cls: 'cw-status-failed' };
  if (level === 'MEDIUM') return { label: 'Medium risk', cls: 'cw-status-pending' };
  if (level === 'LOW') return { label: 'Low risk', cls: 'cw-status-ready' };
  return null;
}

const FREE_PLAN_LIMIT = 1;

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
  const total = documents?.length ?? 0;
  const analyzed = documents?.filter((d) => d.status === 'READY').length ?? 0;
  const highRisk = documents?.filter((d) => d.riskAnalysis?.level === 'HIGH').length ?? 0;
  const thisMonth =
    documents?.filter((d) => {
      const created = new Date(d.createdAt);
      const now = new Date();
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length ?? 0;

  const isFree = (user?.plan ?? 'FREE') === 'FREE';
  const usedOfFree = documents?.filter((d) => d.status !== 'FAILED').length ?? 0;
  const usagePct = isFree ? Math.min(100, Math.round((usedOfFree / FREE_PLAN_LIMIT) * 100)) : 0;

  const stats = [
    { label: 'Total documents', value: total, icon: <DocumentIcon /> },
    { label: 'Analyzed', value: analyzed, icon: <GridIcon /> },
    { label: 'High-risk flags', value: highRisk, icon: <ShieldIcon /> },
    { label: 'This month', value: thisMonth, icon: <TagIcon /> },
  ];

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

      <div className="cw-stat-row">
        {stats.map((s) => (
          <div key={s.label} className="cw-stat-card">
            <div className="cw-stat-icon">{s.icon}</div>
            <div className="cw-stat-value">{s.value}</div>
            <div className="cw-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="cw-two-col">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div id="recent" className="cw-section-title" style={{ marginTop: 0 }}>
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
                    <th>Risk</th>
                    <th>Type</th>
                    <th>Uploaded</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((doc) => {
                    const icon = fileIcon(doc.fileType);
                    const status = statusMeta(doc.status);
                    const risk = riskMeta(doc.riskAnalysis?.level);
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
                        <td>
                          {risk ? <span className={`cw-status-pill ${risk.cls}`}>{risk.label}</span> : <span style={{ color: '#9CA3AF' }}>—</span>}
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

        <div>
          <div className="cw-side-card">
            <div className="cw-side-card-title">Quick Actions</div>
            <Link to="/app/upload" className="cw-side-link-row">
              <DocumentIcon />
              Analyze Document
            </Link>
            <Link to="/app/upload" className="cw-side-link-row">
              <ChatIcon />
              Ask Legal Question
            </Link>
            <Link to="/app/compare" className="cw-side-link-row">
              <ClipboardIcon />
              Compare Documents
            </Link>
            <Link to="/app/templates" className="cw-side-link-row">
              <TagIcon />
              Templates
            </Link>
          </div>

          <div className="cw-side-card" style={{ marginTop: 16 }}>
            <div className="cw-side-card-title">Your Plan</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isFree ? 12 : 4 }}>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#0B1220' }}>{user?.plan || 'FREE'}</span>
              {isFree && (
                <Link to="/app/subscription" style={{ fontSize: 12, fontWeight: 700, color: '#B08D57', textDecoration: 'none' }}>
                  Upgrade
                </Link>
              )}
            </div>
            {isFree ? (
              <>
                <div className="cw-usage-track">
                  <div className="cw-usage-fill" style={{ width: `${usagePct}%` }} />
                </div>
                <div style={{ fontSize: 11.5, color: '#6B7280', marginTop: 6 }}>
                  {usedOfFree} of {FREE_PLAN_LIMIT} free document{FREE_PLAN_LIMIT === 1 ? '' : 's'} used
                  {user && user.documentCredits > 0 ? ` · ${user.documentCredits} credit${user.documentCredits === 1 ? '' : 's'} left` : ''}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: '#6B7280' }}>Unlimited document analysis</div>
            )}
            <Link to="/app/subscription" className="cw-side-link-row" style={{ marginTop: 12, borderBottom: 'none', paddingTop: 12, borderTop: '1px solid #F1F2F5' }}>
              <CreditCardIcon />
              Manage subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
