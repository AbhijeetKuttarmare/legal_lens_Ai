import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, getDocumentReport, getKeyDates, getStoredUser } from '../api';
import type { DocumentReport, KeyDate } from '../types';
import { exportReportPdf } from '../exportPdf';
import { AlertIcon, ArrowLeftIcon, ChatIcon, ClipboardIcon, DocumentIcon, DownloadIcon, ShareIcon } from '../../icons';

const RISK_COLOR: Record<string, string> = { LOW: '#16A34A', MEDIUM: '#D97706', HIGH: '#DC2626' };
const FLAG_COLOR: Record<string, string> = { low: '#16A34A', medium: '#D97706', high: '#DC2626' };

export default function Report() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<DocumentReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const [keyDates, setKeyDates] = useState<KeyDate[] | null>(null);
  const [keyDatesLoading, setKeyDatesLoading] = useState(false);
  const [keyDatesError, setKeyDatesError] = useState<string | null>(null);
  const [shared, setShared] = useState(false);
  const user = getStoredUser();
  const isPremium = user?.plan === 'ENTERPRISE';

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      try {
        const data = await getDocumentReport(id!);
        if (cancelled) return;
        setReport(data);
        if (data.status === 'PROCESSING') {
          pollRef.current = window.setTimeout(load, 2000);
        }
      } catch {
        if (!cancelled) setError('Could not load this document.');
      }
    }
    load();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [id]);

  async function onCheckDeadlines() {
    if (!id) return;
    setKeyDatesLoading(true);
    setKeyDatesError(null);
    try {
      const { keyDates: dates } = await getKeyDates(id);
      setKeyDates(dates);
    } catch (err) {
      setKeyDatesError(err instanceof ApiError ? err.message : 'Could not check for deadlines.');
    } finally {
      setKeyDatesLoading(false);
    }
  }

  function onExport() {
    if (!report) return;
    exportReportPdf(report);
  }

  async function onShare() {
    if (!report) return;
    const url = window.location.href;
    const title = `${report.documentType?.replace(/_/g, ' ') || 'Document'} — Clauzera AI`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // user cancelled the share sheet — nothing to do
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  if (error) {
    return (
      <div className="cw-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        {error}
      </div>
    );
  }

  if (!report) {
    return (
      <div className="cw-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div className="cw-spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (report.status === 'PROCESSING') {
    return (
      <div className="cw-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <div className="cw-spinner" style={{ margin: '0 auto 16px' }} />
        <div style={{ color: 'var(--cw-dark-text)' }}>Still analyzing this document…</div>
      </div>
    );
  }

  if (report.status === 'FAILED') {
    return (
      <div className="cw-container" style={{ textAlign: 'center', paddingTop: 60 }}>
        <AlertIcon style={{ width: 32, height: 32, color: '#DC2626', marginBottom: 10 }} />
        <div style={{ color: '#DC2626' }}>Analysis failed for this document. Please try uploading again.</div>
      </div>
    );
  }

  const risk = report.riskAnalysis;

  return (
    <div className="cw-container">
      <Link to="/app/documents" className="cw-report-back">
        <ArrowLeftIcon /> My Documents
      </Link>

      <div className="cw-report-topbar">
        <div>
          <div className="cw-report-type-label">Document Type</div>
          <div className="cw-report-type-value">{report.documentType?.replace(/_/g, ' ') || 'Document'}</div>
        </div>
        <div className="cw-report-actions">
          {isPremium ? (
            <button className="cw-btn cw-btn-outline" onClick={onExport}>
              <DownloadIcon style={{ width: 16, height: 16 }} /> Download Report
            </button>
          ) : (
            <Link to="/app/subscription" className="cw-btn cw-btn-outline" style={{ textDecoration: 'none' }}>
              <DownloadIcon style={{ width: 16, height: 16 }} /> Download Report
            </Link>
          )}
          <button className="cw-btn cw-btn-navy" onClick={onShare}>
            <ShareIcon style={{ width: 16, height: 16 }} /> {shared ? 'Link copied' : 'Share'}
          </button>
        </div>
      </div>

      {risk && (
        <div className="cw-score-row" style={{ marginBottom: 24 }}>
          <div className="cw-score-ring" style={{ borderColor: RISK_COLOR[risk.level], color: RISK_COLOR[risk.level] }}>
            {risk.score}
          </div>
          <div>
            <div className="cw-score-level">{risk.level} RISK</div>
            <div className="cw-score-sub">out of 100</div>
          </div>
        </div>
      )}

      <div className="cw-two-col">
        <div>
          <div className="cw-card">
            <div className="cw-card-title-row">
              <ClipboardIcon />
              <span className="cw-card-title">Summary</span>
            </div>
            <p className="cw-summary-text">{report.summary?.summaryText}</p>
          </div>

          {!!risk?.flags?.length && (
            <div className="cw-card">
              <div className="cw-card-title-row">
                <AlertIcon />
                <span className="cw-card-title">Risk Flags</span>
              </div>
              {risk.flags.map((flag, idx) => (
                <div key={idx} className="cw-flag-row">
                  <AlertIcon style={{ color: FLAG_COLOR[flag.severity] }} />
                  <div>
                    <div className="cw-flag-title">{flag.title}</div>
                    <div className="cw-flag-detail">{flag.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!!risk?.suggestions?.length && (
            <div className="cw-card">
              <div className="cw-card-title-row">
                <ClipboardIcon />
                <span className="cw-card-title">Before Signing, Ask</span>
              </div>
              {risk.suggestions.map((s, idx) => (
                <div key={idx} className="cw-suggestion-row">
                  <div className="cw-suggestion-bullet">{idx + 1}</div>
                  <div className="cw-suggestion-text">{s}</div>
                </div>
              ))}
            </div>
          )}

          <div className="cw-card">
            <div className="cw-card-title-row">
              <DocumentIcon />
              <span className="cw-card-title">Key Dates & Deadlines</span>
            </div>
            {keyDatesError && <div className="cw-error">{keyDatesError}</div>}
            {keyDates === null && (
              <button className="cw-btn cw-btn-outline" onClick={onCheckDeadlines} disabled={keyDatesLoading}>
                {keyDatesLoading ? 'Checking…' : 'Check for deadlines in this document'}
              </button>
            )}
            {keyDates !== null && keyDates.length === 0 && (
              <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13, margin: 0 }}>No explicit dates or deadlines found in this document.</p>
            )}
            {keyDates !== null &&
              keyDates.map((kd, idx) => (
                <div key={idx} className="cw-flag-row">
                  <AlertIcon style={{ color: '#D97706' }} />
                  <div>
                    <div className="cw-flag-title">{kd.label}</div>
                    <div className="cw-flag-detail">{kd.detail}</div>
                  </div>
                </div>
              ))}
          </div>

          <p className="cw-disclaimer">
            This is an informational explanation, not professional legal advice. Consult a qualified
            lawyer for important decisions.
          </p>
        </div>

        <div className="cw-side-card">
          {!!report.clauseAnalysis?.clauses?.length && (
            <>
              <div className="cw-side-card-title">Clause Cards</div>
              <div className="cw-clause-grid cw-clause-grid--side">
                {report.clauseAnalysis.clauses.map((clause, idx) => (
                  <div key={idx} className="cw-clause-card">
                    <div className="cw-clause-label">{clause.label}</div>
                    <div className="cw-clause-value">{clause.value}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="cw-side-card-title" style={{ marginTop: report.clauseAnalysis?.clauses?.length ? 22 : 0 }}>
            Key Actions
          </div>
          <Link to={`/app/chat/${report.id}`} className="cw-btn cw-btn-gold" style={{ marginBottom: 10, textDecoration: 'none' }}>
            <ChatIcon style={{ width: 18, height: 18 }} /> Ask AI About This Document
          </Link>

          {isPremium ? (
            <button className="cw-btn cw-btn-outline" onClick={onExport}>
              <DocumentIcon style={{ width: 16, height: 16 }} /> Export Report (PDF)
            </button>
          ) : (
            <Link to="/app/subscription" className="cw-btn cw-btn-outline" style={{ textDecoration: 'none' }}>
              <DocumentIcon style={{ width: 16, height: 16 }} /> Export Report (Premium)
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
