import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getStoredUser, listDocuments } from '../api';
import type { DocumentSummary } from '../types';
import {
  AlertIcon,
  CameraIcon,
  ChatIcon,
  CreditCardIcon,
  DocumentIcon,
  GridIcon,
  ShieldIcon,
  TagIcon,
} from '../../icons';

function fileIcon(_fileType: string) {
  return { bg: 'var(--cw-dark-surface-2)', color: 'white' };
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

function riskMeta(level?: 'LOW' | 'MEDIUM' | 'HIGH') {
  if (level === 'HIGH') return { label: 'High Risk', cls: 'cw-status-failed' };
  if (level === 'MEDIUM') return { label: 'Medium Risk', cls: 'cw-status-pending' };
  if (level === 'LOW') return { label: 'Low Risk', cls: 'cw-status-ready' };
  return null;
}

function trend(thisMonth: number, lastMonth: number) {
  if (lastMonth === 0 && thisMonth === 0) return null;
  if (lastMonth === 0) return { dir: 'up' as const, pct: 100 };
  const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);
  return { dir: pct >= 0 ? ('up' as const) : ('down' as const), pct: Math.abs(pct) };
}

const FREE_PLAN_LIMIT = 1;

const FEATURES = [
  { icon: <DocumentIcon />, title: 'Smart Analysis', desc: 'AI scans and understands legal language' },
  { icon: <ShieldIcon />, title: 'Risk Detection', desc: 'Identifies risky clauses and red flags' },
  { icon: <ChatIcon />, title: 'Plain Language', desc: 'Explains complex terms in simple words' },
  { icon: <CreditCardIcon />, title: 'Secure & Private', desc: 'Your documents are 100% encrypted' },
];

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

  const now = new Date();
  const inMonth = (d: DocumentSummary, monthsAgo: number) => {
    const created = new Date(d.createdAt);
    const target = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    return created.getMonth() === target.getMonth() && created.getFullYear() === target.getFullYear();
  };

  const docs = documents || [];
  const thisMonthDocs = docs.filter((d) => inMonth(d, 0));
  const lastMonthDocs = docs.filter((d) => inMonth(d, 1));

  const total = docs.length;
  const analyzed = docs.filter((d) => d.status === 'READY').length;
  const highRisk = docs.filter((d) => d.riskAnalysis?.level === 'HIGH').length;
  const thisMonth = thisMonthDocs.length;

  const stats = [
    {
      label: 'Total Documents',
      value: total,
      icon: <DocumentIcon />,
      trend: trend(thisMonthDocs.length, lastMonthDocs.length),
    },
    {
      label: 'Analyzed',
      value: analyzed,
      icon: <GridIcon />,
      trend: trend(thisMonthDocs.filter((d) => d.status === 'READY').length, lastMonthDocs.filter((d) => d.status === 'READY').length),
    },
    {
      label: 'High-Risk Flags',
      value: highRisk,
      icon: <ShieldIcon />,
      trend: trend(thisMonthDocs.filter((d) => d.riskAnalysis?.level === 'HIGH').length, lastMonthDocs.filter((d) => d.riskAnalysis?.level === 'HIGH').length),
    },
    { label: 'This Month', value: thisMonth, icon: <TagIcon />, trend: trend(thisMonthDocs.length, lastMonthDocs.length) },
  ];

  const isFree = (user?.plan ?? 'FREE') === 'FREE';
  const usedOfFree = docs.filter((d) => d.status !== 'FAILED').length;
  const usagePct = isFree ? Math.min(100, Math.round((usedOfFree / FREE_PLAN_LIMIT) * 100)) : 0;

  return (
    <div className="cw-container">
      <div className="cw-hero">
        <h1>Welcome back, {user?.firstName || 'there'}</h1>
        <p>Upload any legal document and get AI-powered insights in seconds.</p>
        <button className="cw-btn cw-btn-gold" onClick={() => navigate('/app/upload')}>
          Analyze a Document
        </button>
        <div className="cw-hero-caption">Supports PDF, DOCX · Max 20MB · Your data is secure and confidential</div>
      </div>

      <div className="cw-stat-row">
        {stats.map((s) => (
          <div key={s.label} className="cw-stat-card">
            <div className="cw-stat-icon">{s.icon}</div>
            <div className="cw-stat-value">{s.value}</div>
            <div className="cw-stat-label">{s.label}</div>
            {s.trend && (
              <div className={`cw-stat-trend ${s.trend.dir}`}>
                {s.trend.dir === 'up' ? '↑' : '↓'} {s.trend.pct}% from last month
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="cw-two-col">
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div id="recent" className="cw-section-title" style={{ marginTop: 0 }}>
              Recent Documents
            </div>
            <Link to="/app/documents" style={{ color: 'var(--cw-gold-bright)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>
              View all →
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
                    const size = formatFileSize(doc.fileSize);
                    return (
                      <tr key={doc.id} onClick={() => navigate(`/app/report/${doc.id}`)}>
                        <td>
                          <div className="cw-doc-name-cell">
                            <div className="cw-doc-icon" style={{ background: icon.bg, color: icon.color }}>
                              <CameraIcon />
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
                        <td>
                          {risk ? <span className={`cw-status-pill ${risk.cls}`}>{risk.label}</span> : <span style={{ color: 'var(--cw-dark-text-muted)' }}>—</span>}
                        </td>
                        <td style={{ color: 'var(--cw-dark-text-muted)' }}>{doc.documentType?.replace(/_/g, ' ') || '—'}</td>
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

          <div className="cw-stat-row" style={{ marginTop: 24, gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {FEATURES.map((f) => (
              <div key={f.title} className="cw-stat-card">
                <div className="cw-stat-icon">{f.icon}</div>
                <div style={{ fontWeight: 700, color: 'white', fontSize: 13 }}>{f.title}</div>
                <div className="cw-stat-label">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="cw-side-card">
            <div className="cw-side-card-title">Quick Actions</div>
            <Link to="/app/upload" className="cw-side-link-row">
              <DocumentIcon />
              Upload Document
            </Link>
            <Link to="/app/upload" className="cw-side-link-row">
              <ChatIcon />
              Analyze Document
            </Link>
            <Link to="/app/compare" className="cw-side-link-row">
              <GridIcon />
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
              <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{user?.plan || 'FREE'}</span>
              {isFree && (
                <Link to="/app/subscription" style={{ fontSize: 12, fontWeight: 700, color: 'var(--cw-gold-bright)', textDecoration: 'none' }}>
                  Upgrade
                </Link>
              )}
            </div>
            {isFree ? (
              <>
                <div className="cw-usage-track">
                  <div className="cw-usage-fill" style={{ width: `${usagePct}%` }} />
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--cw-dark-text-muted)', marginTop: 6 }}>
                  {usedOfFree} of {FREE_PLAN_LIMIT} free document{FREE_PLAN_LIMIT === 1 ? '' : 's'} used
                  {user && user.documentCredits > 0 ? ` · ${user.documentCredits} credit${user.documentCredits === 1 ? '' : 's'} left` : ''}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--cw-dark-text-muted)' }}>Unlimited document analysis</div>
            )}
            <Link
              to="/app/subscription"
              className="cw-side-link-row"
              style={{ marginTop: 12, borderBottom: 'none', paddingTop: 12, borderTop: '1px solid var(--cw-dark-border)' }}
            >
              <CreditCardIcon />
              Manage subscription
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
