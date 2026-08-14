import { useEffect, useState } from 'react';
import { ApiError, compareDocuments, listDocuments, getStoredUser } from '../api';
import type { ComparisonResult, DocumentSummary } from '../types';
import { AlertIcon } from '../../icons';
import UpgradeGate from '../UpgradeGate';

export default function Compare() {
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  const user = getStoredUser();
  const isPaid = user?.plan === 'PRO' || user?.plan === 'ENTERPRISE';

  useEffect(() => {
    if (!isPaid) return;
    listDocuments()
      .then((docs) => setDocuments(docs.filter((d) => d.status === 'READY')))
      .catch(() => setError('Could not load your documents.'));
  }, [isPaid]);

  async function onCompare() {
    if (!idA || !idB || idA === idB) {
      setError('Choose two different documents to compare.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await compareDocuments(idA, idB);
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not compare these documents.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cw-container cw-container-narrow">
      <div className="cw-section-title" style={{ marginTop: 0 }}>
        Compare Documents
      </div>
      <p style={{ color: 'var(--cw-dark-text-muted)', fontSize: 13.5, marginTop: -6, marginBottom: 22 }}>
        Pick two analyzed documents — e.g. two job offers — to see the key differences side by side.
      </p>

      {!isPaid && <UpgradeGate feature="Document Comparison" />}

      {isPaid && error && <div className="cw-error">{error}</div>}

      {isPaid && documents === null && !error && (
        <div className="cw-empty">
          <div className="cw-spinner" style={{ margin: '0 auto 12px' }} />
          Loading your documents…
        </div>
      )}

      {documents !== null && documents.length < 2 && (
        <div className="cw-empty">
          <AlertIcon style={{ width: 32, height: 32, opacity: 0.4, marginBottom: 8 }} />
          <div>You need at least 2 analyzed documents to compare. Upload another one first.</div>
        </div>
      )}

      {documents !== null && documents.length >= 2 && (
        <>
          <label className="cw-field-label" style={{ color: 'white' }}>Document A</label>
          <select className="cw-input-plain" value={idA} onChange={(e) => setIdA(e.target.value)}>
            <option value="">Select a document…</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fileName}
              </option>
            ))}
          </select>

          <label className="cw-field-label" style={{ color: 'white' }}>Document B</label>
          <select className="cw-input-plain" value={idB} onChange={(e) => setIdB(e.target.value)}>
            <option value="">Select a document…</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fileName}
              </option>
            ))}
          </select>

          <button className="cw-btn cw-btn-gold" onClick={onCompare} disabled={loading || !idA || !idB} style={{ marginTop: 4 }}>
            {loading ? 'Comparing…' : 'Compare'}
          </button>
        </>
      )}

      {result && (
        <div style={{ marginTop: 28 }}>
          <div className="cw-card" style={{ background: 'var(--cw-dark-surface-2)' }}>
            <div style={{ color: 'var(--cw-gold-bright)', fontWeight: 700, fontSize: 12.5, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Verdict
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--cw-dark-text)' }}>{result.verdict}</p>
          </div>

          <div className="cw-section-title">Key Differences</div>
          {result.differences.map((diff, idx) => (
            <div key={idx} className="cw-card">
              <div style={{ fontWeight: 700, color: 'white', fontSize: 13.5, marginBottom: 10 }}>{diff.aspect}</div>
              <div className="cw-diff-grid">
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--cw-dark-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {result.documentA.fileName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--cw-dark-text)', marginTop: 2 }}>{diff.documentAValue}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10.5, color: 'var(--cw-dark-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {result.documentB.fileName}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--cw-dark-text)', marginTop: 2 }}>{diff.documentBValue}</div>
                </div>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--cw-dark-text-muted)', borderTop: '1px solid var(--cw-dark-border)', paddingTop: 8 }}>{diff.note}</div>
            </div>
          ))}
        </div>
      )}

      <p className="cw-disclaimer">
        This is an informational comparison, not professional legal advice. Consult a qualified lawyer for important
        decisions.
      </p>
    </div>
  );
}
